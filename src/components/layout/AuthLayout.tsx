import { Outlet } from "react-router-dom";

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-blue-150 flex items-center justify-center p-4">
      <div className="w-full flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
};