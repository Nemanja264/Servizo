
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import '../styles/StripeCheckout.css';


function getCookie(name) {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${name}=`);
  if (p.length === 2) return p.pop().split(';').shift();
  return '';
}


function useOrderIdsFromQuery(fallback = []) {
  const [ids, setIds] = useState(fallback);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('order_ids');
    if (raw && !ids?.length) {
      const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
      setIds(parsed);
    }
  }, []); 
  return ids;
}


function PaymentForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [piInfo, setPiInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  
  useEffect(() => {
    if (!stripe || !clientSecret) return;
    let mounted = true;
    (async () => {
      const res = await stripe.retrievePaymentIntent(clientSecret);
      if (mounted && res?.paymentIntent) {
        const pi = res.paymentIntent;
        setPiInfo({
          id: pi.id,
          amount: pi.amount,
          currency: (pi.currency || '').toUpperCase(),
          status: pi.status,
        });
      }
    })();
    return () => { mounted = false; };
  }, [stripe, clientSecret]);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErr('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order`, 
        receipt_email: email || undefined,
        payment_method_data: {
          billing_details: {
            name: name || undefined,
            email: email || undefined,
          },
        },
      },
      redirect: 'always',
    });

    if (error) {
      setErr(error.message || 'Payment failed');
      setSubmitting(false);
      return;
    }

   
    setSubmitting(false);
  }, [stripe, elements, email, name]);

  return (
    <div className="checkout">
      <h1 className="checkout__title">Payment</h1>

      {piInfo && (
        <div className="pi-card" aria-live="polite">
          <div className="pi-card__row"><span className="pi-card__label">Amount:</span><span className="pi-card__value">{(piInfo.amount/100).toFixed(2)} {piInfo.currency}</span></div>
        </div>
      )}

      <form className="pay-form" onSubmit={onSubmit} noValidate>
        <div className="form-field">
          <label className="form-label" htmlFor="buyer-name">Name and surname</label>
          <input
            id="buyer-name"
            className="input"
            type="text"
            placeholder="Name Surname"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="buyer-email">Email</label>
          <input
            id="buyer-email"
            className="input"
            type="email"
            placeholder="buyer@example.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label">Payment information</label>
          <div className="pm-wrapper">
            <PaymentElement />
          </div>
        </div>

        {err && <div className="form-error" role="alert">{err}</div>}

        <button
          className={`btn ${submitting ? 'btn--loading' : ''}`}
          type="submit"
          disabled={!stripe || !elements || submitting}
        >
          {submitting ? 'Processing...' : 'Pay'}
        </button>
      </form>
    </div>
  );
}


export default function StripeCheckout({ orderIds: propOrderIds }) {
  const orderIds = useOrderIdsFromQuery(propOrderIds || []);
  const [pk, setPk] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/payments/config/', { credentials: 'include' });
        if (!res.ok) throw new Error('config failed');
        const data = await res.json();
        if (!data?.publishableKey) throw new Error('missing key');
        if (!mounted) return;
        setPk(data.publishableKey);
        setStripePromise(loadStripe(data.publishableKey));
      } catch {
        if (mounted) setErr('Unsuccessful Stripe configuration download');
      }
    })();
    return () => { mounted = false; };
  }, []);

  
  useEffect(() => {
    let mounted = true;
    if (!pk) return;
    if (!orderIds || orderIds.length === 0) {
      setErr('Missing order_ids');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await fetch('/api/payments/create-intent/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'Idempotency-Key': (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()),
          },
          body: JSON.stringify({ order_ids: orderIds }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!mounted) return;
        setClientSecret(data?.clientSecret || '');
        setLoading(false);
      } catch {
        if (mounted) {
          setErr('Unsuccessful creation of Payment Intent');
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [pk, orderIds]);

  const elementsOptions = useMemo(() => ({
    clientSecret,
  
  }), [clientSecret]);

  if (err) {
    return (
      <div className="screen">
        <h1 className="screen__title">Error</h1>
        <div className="screen__error">{err}</div>
      </div>
    );
  }

  if (loading || !stripePromise || !clientSecret) {
    return (
      <div className="screen">
        <h1 className="screen__title">Payment</h1>
        <div className="screen__loading">Loading…</div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentForm clientSecret={clientSecret} />
    </Elements>
  );
}
