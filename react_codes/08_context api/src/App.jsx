import ProfiLe from "./components/ProfiLe";
import Login from "./components/Login";

import UserContextProvider from "./context/UserContextProvider.jsx";

function App() {
  return (
    <UserContextProvider>
      <h1>React</h1>
      <Login />
      <ProfiLe />
    </UserContextProvider>
  );
}

export default App;
