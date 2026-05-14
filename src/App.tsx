import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route, Switch } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OTPPage from './pages/auth/OTPPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import MainTabs from './pages/tabs/MainTabs'
import ProfilePage from './pages/tabs/ProfilePage'
import SupportPage from './pages/tabs/SupportPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import TestUploadPage from './pages/TestUploadPage'

export default function App() {
  const { user, loading, hasProfile } = useAuth()

  if (loading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--pep-purple-pale)' }}>
          <IonSpinner name="crescent" color="primary" />
        </div>
      </IonApp>
    )
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>
            <Route exact path="/test-upload" component={TestUploadPage} />
            <Route exact path="/login" component={LoginPage} />
            <Route exact path="/register" component={RegisterPage} />
            <Route exact path="/otp" component={OTPPage} />
            <Route exact path="/forgot-password" component={ForgotPasswordPage} />
            <Route path="/onboarding" component={OnboardingPage} />
            <Route path="/tabs" component={MainTabs} />
            <Route exact path="/profile" component={ProfilePage} />
            <Route exact path="/support" component={SupportPage} />
            <Route exact path="/">
              {!user
                ? <Redirect to="/login" />
                : !hasProfile
                  ? <Redirect to="/onboarding" />
                  : <Redirect to="/tabs/home" />
              }
            </Route>
            <Redirect to="/" />
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}
