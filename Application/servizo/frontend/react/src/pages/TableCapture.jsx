import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { setStoredTable } from "../utils/tables";


export default function TableCapture({ redirectTo = "/" }) {
  const { tableNum } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const n = parseInt(String(tableNum), 10);
    if (Number.isFinite(n) && n > 0) {
      setStoredTable(n);
      navigate(`${redirectTo}?table=${n}`, { replace: true, state: { fromTableCapture: true } });
    } else {
      navigate("/", { replace: true, state: { invalidTable: true } });
    }
  }, [tableNum, navigate, redirectTo]);

  return null;
}
