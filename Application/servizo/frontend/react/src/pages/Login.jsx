import Form from "../components/Form"
import "../styles/Login.css"

function Login() {
  
  return (
          <div className="register-container">
            <Form route="/api/auth/login/" method="login" />
          </div>
        )
}

export default Login
