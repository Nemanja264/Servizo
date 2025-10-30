import Form from "../components/Form"
import "../styles/Register.css"

function Register() {
  return (
  <div className="register-container">

      <Form route="/api/auth/register/" method="register" />
  </div>
  )
}

export default Register
