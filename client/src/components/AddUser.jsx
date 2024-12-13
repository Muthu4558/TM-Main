import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Loading from "./Loader";
import Button from "./Button";
import { useRegisterMutation } from "../redux/slices/api/authApiSlice";
import { toast } from "sonner";
import { useUpdateUserMutation } from "../redux/slices/api/userApiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const AddUser = ({ open, setOpen, userData }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const defaultValues = userData ?? {};
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  const [addNewUser, { isLoading }] = useRegisterMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  const handleOnSubmit = async (data) => {
    if (!user?.isAdmin) {
      toast.error("Only admins can perform this action");
      return;
    }

    try {
      if (userData) {
        const result = await updateUser(data).unwrap();
        toast.success("User updated successfully", {
          style: {
            backgroundColor: "#4caf50",
            color: "#fff",
            fontSize: "16px",
            padding: "10px",
          },
        });

        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 1500);

        if (userData?._id === user._id) {
          dispatch(setCredentials({ ...result.user }));
        }
      } else {
        const result = await addNewUser({ ...data, password: data.password || data.email }).unwrap();
        toast.success("New user added successfully", {
          style: {
            backgroundColor: "#4caf50",
            color: "#fff",
            fontSize: "16px",
            padding: "10px",
          },
        });
      }

      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)} className="">
        <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
          {userData ? "UPDATE PROFILE" : "ADD NEW USER"}
        </Dialog.Title>
        <div className="mt-2 flex flex-col gap-6">
          <Textbox
            placeholder="Full name"
            type="text"
            name="name"
            label="Full Name"
            className="w-full rounded text-gray-900"
            register={register("name", { required: "Full name is required!" })}
            error={errors.name ? errors.name.message : ""}
            readOnly={!user?.isAdmin}
          />
          <div className="w-full rounded">
            <label className="block text-md font-medium text-gray-700" htmlFor="department">
              Department
            </label>
            <select
              id="department"
              name="department"
              {...register("title", { required: "Department is required!" })}
              className="w-full mt-2 bg-transparent px-3 py-2.5 2xl:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 outline-none text-base focus:ring-2 ring-blue-300"
            >
              <option value="">Select Department</option>
              <option value="Chairman">Chairman</option>
              <option value="IT">IT</option>
              <option value="BL">Business Lead</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Networking">Networking</option>
              <option value="Telecalling">Telecalling</option>
              <option value="HR">HR</option>
            </select>
            {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <Textbox
            placeholder="Role"
            type="text"
            name="role"
            label="Role"
            className="w-full rounded text-gray-900"
            register={register("role", { required: "User role is required!" })}
            error={errors.role ? errors.role.message : ""}
          />
          <Textbox
            placeholder="Email Address"
            type="email"
            name="email"
            label="Email Address"
            className="w-full rounded text-gray-900"
            register={register("email", { required: "Email address is required!" })}
            error={errors.email ? errors.email.message : ""}
          />
          {user?.isAdmin && (
            <div className="relative">
              <Textbox
                placeholder="Password"
                type={showPassword ? "text" : "password"} // Toggle password visibility
                name="password"
                label="Password"
                className="w-full rounded text-gray-900"
                register={register("password")}
                error={errors.password ? errors.password.message : ""}
              />
              <div
                className="absolute top-12 right-3 font-extrabold transform -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-600 text-1xl" /> // Increased size here
                ) : (
                  <FaEye className="text-gray-600 text-1xl" /> // Increased size here
                )}
              </div>

            </div>
          )}
        </div>

        {isLoading || isUpdating ? (
          <div className="py-5">
            <Loading />
          </div>
        ) : (
          <div className="py-3 mt-4 sm:flex sm:flex-row-reverse">
            {user?.isAdmin && (
              <Button
                type="submit"
                className="bg-[#229ea6] px-8 text-sm font-semibold text-white sm:w-auto"
                label="Submit"
              />
            )}
            <Button
              type="button"
              className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => setOpen(false)}
              label="Cancel"
            />
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default AddUser;
