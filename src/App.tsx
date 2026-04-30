import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./router";

function App() {

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "rounded-md border border-gray-200 bg-white text-gray-800",
            title: "text-sm font-semibold text-gray-950",
            description: "text-sm text-gray-500",
            success: "border-l-4 border-l-emerald-600",
            error: "border-l-4 border-l-red-600",
            info: "border-l-4 border-l-[#0b1f4d]",
            loading: "border-l-4 border-l-[#0b1f4d]",
            closeButton: "border-gray-200 bg-white text-gray-500 hover:text-gray-950",
          },
        }}
      />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </>
  );
}

export default App;
