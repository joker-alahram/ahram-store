import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../state/AppContext'
import Button from '../components/Button'
import Input from '../components/Input'
import { Card } from '../components/Card'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { login: doLogin } = useApp()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await doLogin(login, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AUTH_INVALID_CREDENTIALS')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2>تسجيل الدخول</h2>
      <form className="form-stack" onSubmit={submit}>
        <Input placeholder="رقم الهاتف أو اسم المستخدم" value={login} onChange={(e) => setLogin(e.target.value)} />
        <Input placeholder="كلمة المرور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="error-text">{error}</p> : null}
        <Button disabled={busy}>{busy ? 'جاري الدخول...' : 'دخول'}</Button>
      </form>
    </Card>
  )
}
