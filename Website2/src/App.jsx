import AppProviders from '@app/providers/AppProviders'
import WhatsappChat from '@features/chat/WhatsappChat'

function App() {
  return (
    <div>
      <WhatsappChat />
      <AppProviders />
    </div>
  )
}

export default App
