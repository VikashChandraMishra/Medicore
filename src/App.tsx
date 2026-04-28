import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";

function App() {

  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<SignUp />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
