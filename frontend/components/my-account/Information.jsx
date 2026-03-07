"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "@/services/user/profile.service";
import { updateUser } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";

export default function Information() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const addToast = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    country: "Australia",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [newPasswordType, setNewPasswordType] = useState("password");

  useEffect(() => {
    if (user) {
      const names = user.fullName?.split(" ") || ["", ""];
      setFormData((prev) => ({
        ...prev,
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        mobileNumber: user.mobileNumber || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic validation for password change if attempted
      if (formData.newPassword || formData.confirmPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          addToast("Passwords do not match", "error");
          setIsLoading(false);
          return;
        }
        if (!formData.password) {
          addToast("Current password is required to change password", "error");
          setIsLoading(false);
          return;
        }
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobileNumber: formData.mobileNumber,
      };

      // Only add password fields if user is attempting to change password
      if (formData.newPassword) {
        payload.currentPassword = formData.password;
        payload.newPassword = formData.newPassword;
      }

      const response = await updateProfile(payload);

      if (response.success) {
        addToast("Profile updated successfully", "success");
        // Update local state if the API returns the updated user
        if (response.data) {
          dispatch(updateUser(response.data));
        } else {
          // Fallback: update with local data if API doesn't return user
          dispatch(
            updateUser({
              ...user,
              fullName: `${formData.firstName} ${formData.lastName}`.trim(),
              mobileNumber: formData.mobileNumber,
            }),
          );
        }

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          password: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        addToast(response.message || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      addToast(error.message || "Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => {
    setPasswordType((prevType) =>
      prevType === "password" ? "text" : "password",
    );
  };

  const toggleConfirmPassword = () => {
    setConfirmPasswordType((prevType) =>
      prevType === "password" ? "text" : "password",
    );
  };

  const toggleNewPassword = () => {
    setNewPasswordType((prevType) =>
      prevType === "password" ? "text" : "password",
    );
  };

  if (!user && token) {
    return (
      <div className="my-account-content">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "300px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-account-content">
      <div className="account-details">
        <form
          onSubmit={handleSubmit}
          className="form-account-details form-has-password"
        >
          <div className="account-info">
            <h5 className="title">Information</h5>
            <div className="cols mb_20">
              <fieldset className="">
                <input
                  type="text"
                  placeholder="First Name*"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </fieldset>
              <fieldset className="">
                <input
                  type="text"
                  placeholder="Last Name*"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </fieldset>
            </div>
            <div className="cols mb_20">
              <fieldset className="">
                <input
                  type="email"
                  placeholder="Username or email address*"
                  name="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                  className="bg-light"
                />
              </fieldset>
              <fieldset className="">
                <input
                  type="text"
                  placeholder="Phone*"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                />
              </fieldset>
            </div>
            <div className="tf-select">
              <select
                className="text-title"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="Australia">Australia</option>
                <option value="Austria">Austria</option>
                <option value="Belgium">Belgium</option>
                <option value="Canada">Canada</option>
                <option value="Czech Republic">Czechia</option>
                <option value="Denmark">Denmark</option>
                <option value="Finland">Finland</option>
                <option value="France">France</option>
                <option value="Germany">Germany</option>
                <option value="Hong Kong">Hong Kong SAR</option>
                <option value="Ireland">Ireland</option>
                <option value="Israel">Israel</option>
                <option value="Italy">Italy</option>
                <option value="Japan">Japan</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Netherlands">Netherlands</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Norway">Norway</option>
                <option value="Poland">Poland</option>
                <option value="Portugal">Portugal</option>
                <option value="Singapore">Singapore</option>
                <option value="South Korea">South Korea</option>
                <option value="Spain">Spain</option>
                <option value="Sweden">Sweden</option>
                <option value="Switzerland">Switzerland</option>
                <option value="United Arab Emirates">
                  United Arab Emirates
                </option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Vietnam">Vietnam</option>
              </select>
            </div>
          </div>
          <div className="account-password">
            <h5 className="title">Change Password (Optional)</h5>
            <fieldset className="position-relative password-item mb_20">
              <input
                className="input-password"
                type={passwordType}
                placeholder="Current Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <span
                className={`toggle-password ${
                  !(passwordType === "text") ? "unshow" : ""
                }`}
                onClick={togglePassword}
              >
                <i
                  className={`icon-eye-${
                    !(passwordType === "text") ? "hide" : "show"
                  }-line`}
                />
              </span>
            </fieldset>
            <fieldset className="position-relative password-item mb_20">
              <input
                className="input-password"
                type={newPasswordType}
                placeholder="New Password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              />
              <span
                className={`toggle-password ${
                  !(newPasswordType === "text") ? "unshow" : ""
                }`}
                onClick={toggleNewPassword}
              >
                <i
                  className={`icon-eye-${
                    !(newPasswordType === "text") ? "hide" : "show"
                  }-line`}
                />
              </span>
            </fieldset>
            <fieldset className="position-relative password-item">
              <input
                className="input-password"
                type={confirmPasswordType}
                placeholder="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <span
                className={`toggle-password ${
                  !(confirmPasswordType === "text") ? "unshow" : ""
                }`}
                onClick={toggleConfirmPassword}
              >
                <i
                  className={`icon-eye-${
                    !(confirmPasswordType === "text") ? "hide" : "show"
                  }-line`}
                />
              </span>
            </fieldset>
          </div>
          <div className="button-submit">
            <button
              className="tf-btn btn-fill"
              type="submit"
              disabled={isLoading}
            >
              <span className="text text-button">
                {isLoading ? "Updating..." : "Update Account"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
