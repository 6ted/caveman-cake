import Home from "./Pages/Home";
import Payment from "./Pages/Payment";
import Download from "./Pages/Download";

function App() {
  const path = window.location.pathname;

  if (path === "/payment") {
    return <Payment />;
  }

  if (path === "/download") {
    return <Download />;
  }

  return <Home />;
}

export default App;