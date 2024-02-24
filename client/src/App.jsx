import AuthProvider from "./provider/authProvider";
import Routes from "./pages/ProtectedRoutes";

function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  )
}

export default App;
