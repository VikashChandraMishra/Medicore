import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
