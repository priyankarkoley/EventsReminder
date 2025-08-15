import toast, { Toaster } from "react-hot-toast";

// Configure react-hot-toast with middle top position
export const showToast = {
  success: (message: string) =>
    toast.success(message, {
      position: "top-center",
      duration: 4000,
    }),
  error: (message: string) =>
    toast.error(message, {
      position: "top-center",
      duration: 5000,
    }),
  loading: (message: string) =>
    toast.loading(message, {
      position: "top-center",
    }),
};

export { toast, Toaster };
