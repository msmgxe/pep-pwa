import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react'
import { Route, Redirect } from 'react-router-dom'
import { homeOutline, scaleOutline, trendingUpOutline, calendarOutline, bulbOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import HomePage from './HomePage'
import WeightPage from './WeightPage'
import ProgressPage from './ProgressPage'
import RemindersPage from './RemindersPage'
import TipsPage from './TipsPage'

export default function MainTabs() {
  const { t } = useTranslation()

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/home" component={HomePage} />
        <Route exact path="/tabs/weight" component={WeightPage} />
        <Route exact path="/tabs/progress" component={ProgressPage} />
        <Route exact path="/tabs/reminders" component={RemindersPage} />
        <Route exact path="/tabs/tips" component={TipsPage} />
        <Route exact path="/tabs">
          <Redirect to="/tabs/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>{t('nav_home')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="weight" href="/tabs/weight">
          <IonIcon icon={scaleOutline} />
          <IonLabel>{t('nav_weight')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="progress" href="/tabs/progress">
          <IonIcon icon={trendingUpOutline} />
          <IonLabel>{t('nav_progress')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reminders" href="/tabs/reminders">
          <IonIcon icon={calendarOutline} />
          <IonLabel>{t('nav_reminders')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tips" href="/tabs/tips">
          <IonIcon icon={bulbOutline} />
          <IonLabel>{t('nav_tips')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  )
}
