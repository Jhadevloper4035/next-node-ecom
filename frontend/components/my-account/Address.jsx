"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addressStart,
  fetchAddressesSuccess,
  addAddressSuccess,
  updateAddressSuccess,
  removeAddressSuccess,
  addressFailure,
} from "@/redux/addressSlice";
import {
  getAllAddresses,
  createAddress,
  updateAddress,
  deleteAddress as deleteAddressApi,
} from "@/services/address/address.service";
import { useToast } from "@/components/common/ToastContext";

export default function Address() {
  const dispatch = useDispatch();
  const { addresses, isLoading } = useSelector((state) => state.address);
  const toast = useToast();

  const [editingId, setEditingId] = useState(null);
  const [localAddresses, setLocalAddresses] = useState([]);

  // Form states for adding new address
  const [newAddress, setNewAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "United States",
    city: "",
    isDefault: false,
  });

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAll = async () => {
      dispatch(addressStart());
      try {
        const response = await getAllAddresses();
        dispatch(fetchAddressesSuccess(response.data || response));
      } catch (err) {
        dispatch(addressFailure(err?.message || "Failed to fetch addresses"));
      }
    };
    fetchAll();
  }, [dispatch]);

  // Sync Redux addresses with local state for editing
  useEffect(() => {
    setLocalAddresses(
      addresses.map((addr) => ({
        ...addr,
        isEditing: (addr.id || addr._id) === editingId,
      }))
    );
  }, [addresses, editingId]);

  const handleEditToggle = (id) => {
    setEditingId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    dispatch(addressStart());
    try {
      await deleteAddressApi(id);
      dispatch(removeAddressSuccess(id));
      toast("Address deleted successfully", "success");
    } catch (err) {
      const msg = err?.message || "Failed to delete address";
      dispatch(addressFailure(msg));
      toast(msg, "error");
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    dispatch(addressStart());
    try {
      const response = await createAddress(newAddress);
      dispatch(addAddressSuccess(response.data || response));
      toast("Address added successfully", "success");
      setNewAddress({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        country: "United States",
        city: "",
        isDefault: false,
      });
      document.querySelector(".createForm").classList.remove("d-block");
    } catch (err) {
      const msg = err?.message || "Failed to add address";
      dispatch(addressFailure(msg));
      toast(msg, "error");
    }
  };

  const handleUpdateAddress = async (e, id, editData) => {
    e.preventDefault();
    dispatch(addressStart());
    try {
      const response = await updateAddress(id, editData);
      dispatch(updateAddressSuccess(response.data || response));
      toast("Address updated successfully", "success");
      setEditingId(null);
    } catch (err) {
      const msg = err?.message || "Failed to update address";
      dispatch(addressFailure(msg));
      toast(msg, "error");
    }
  };

  const handleInputChange = (e, isEdit = false, id = null) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (isEdit) {
      setLocalAddresses((prev) =>
        prev.map((addr) =>
          (addr.id || addr._id) === id ? { ...addr, [name]: val } : addr
        )
      );
    } else {
      setNewAddress((prev) => ({ ...prev, [name]: val }));
    }
  };


  return (
    <div className="my-account-content">
      <div className="account-address">
        <div className="text-center widget-inner-address">
          <button
            className="tf-btn btn-fill radius-4 mb_20 btn-address"
            onClick={() =>
              document.querySelector(".createForm").classList.toggle("d-block")
            }
          >
            <span className="text text-caption-1">Add a new address</span>
          </button>
          <form
            className="show-form-address wd-form-address createForm"
            onSubmit={handleAddAddress}
          >
            <div className="title">Add a new address</div>
            <div className="cols mb_20">
              <fieldset className="">
                <input
                  type="text"
                  placeholder="First Name*"
                  name="firstName"
                  value={newAddress.firstName}
                  onChange={(e) => handleInputChange(e)}
                  required
                />
              </fieldset>
              <fieldset className="">
                <input
                  type="text"
                  placeholder="Last Name*"
                  name="lastName"
                  value={newAddress.lastName}
                  onChange={(e) => handleInputChange(e)}
                  required
                />
              </fieldset>
            </div>
            <div className="cols mb_20">
              <fieldset className="">
                <input
                  type="email"
                  placeholder="Email address*"
                  name="email"
                  value={newAddress.email}
                  onChange={(e) => handleInputChange(e)}
                  required
                />
              </fieldset>
              <fieldset className="">
                <input
                  type="text"
                  placeholder="Phone*"
                  name="phone"
                  value={newAddress.phone}
                  onChange={(e) => handleInputChange(e)}
                  required
                />
              </fieldset>
            </div>
            <fieldset className="mb_20">
              <input
                type="text"
                placeholder="Address"
                name="address"
                value={newAddress.address}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </fieldset>
            <div className="tf-select mb_20">
              <select
                className="text-title"
                name="country"
                value={newAddress.country}
                onChange={(e) => handleInputChange(e)}
              >
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="United States">United States</option>
                <option value="France">France</option>
                <option value="Germany">Germany</option>
                <option value="Italy">Italy</option>
                <option value="Japan">Japan</option>
                <option value="Vietnam">Vietnam</option>
              </select>
            </div>
            <fieldset className="mb_20">
              <input
                type="text"
                placeholder="City"
                name="city"
                value={newAddress.city}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </fieldset>
            <div className="tf-cart-checkbox mb_20">
              <div className="tf-checkbox-wrapp">
                <input
                  type="checkbox"
                  id="create-address-default"
                  name="isDefault"
                  checked={newAddress.isDefault}
                  onChange={(e) => handleInputChange(e)}
                />
                <div>
                  <i className="icon-check" />
                </div>
              </div>
              <label htmlFor="create-address-default">Set as default address.</label>
            </div>
            <div className="d-flex align-items-center justify-content-center gap-20">
              <button type="submit" className="tf-btn btn-fill radius-4">
                <span className="text">Add address</span>
              </button>
              <span
                className="tf-btn btn-fill radius-4 btn-hide-address"
                onClick={() =>
                  document.querySelector(".createForm").classList.remove("d-block")
                }
              >
                <span className="text">Cancel</span>
              </span>
            </div>
          </form>

          {isLoading ? (
            <div className="text-center p-4">Loading addresses...</div>
          ) : localAddresses.length === 0 ? (
            <div className="text-center p-4">No addresses found. Add a new one above.</div>
          ) : (
            <div className="list-account-address">
              {localAddresses.map((address) => (
                <div className="account-address-item" key={address.id || address._id}>
                  <h6 className="mb_20">{address.isDefault ? "Default" : "Address"}</h6>
                  <p>{`${address.firstName} ${address.lastName}`}</p>
                  <p>{address.address}</p>
                  <p>{`${address.city}, ${address.country}`}</p>
                  <p>{address.email}</p>
                  <p className="mb_10">{address.phone}</p>
                  <div className="d-flex gap-10 justify-content-center">
                    <button
                      className="tf-btn radius-4 btn-fill justify-content-center btn-edit-address"
                      onClick={() => handleEditToggle(address.id || address._id)}
                    >
                      <span className="text">{address.isEditing ? "Close" : "Edit"}</span>
                    </button>
                    <button
                      className="tf-btn radius-4 btn-outline justify-content-center btn-delete-address"
                      onClick={() => handleDelete(address.id || address._id)}
                    >
                      <span className="text">Delete</span>
                    </button>
                  </div>
                  {address.isEditing && (
                    <form
                      className="edit-form-address wd-form-address d-block"
                      onSubmit={(e) => handleUpdateAddress(e, address.id || address._id, address)}
                    >
                      <div className="title">Edit address</div>
                      <fieldset className="mb_20">
                        <input
                          type="text"
                          placeholder="First Name*"
                          name="firstName"
                          value={address.firstName || ""}
                          onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          required
                        />
                      </fieldset>
                      <fieldset className="mb_20">
                        <input
                          type="text"
                          placeholder="Last Name*"
                          name="lastName"
                          value={address.lastName || ""}
                          onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          required
                        />
                      </fieldset>
                      <fieldset className="mb_20">
                        <input
                          type="email"
                          placeholder="Email*"
                          name="email"
                          value={address.email || ""}
                          onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          required
                        />
                      </fieldset>
                      <fieldset className="mb_20">
                        <input
                          type="text"
                          placeholder="Phone*"
                          name="phone"
                          value={address.phone || ""}
                          onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          required
                        />
                      </fieldset>
                      <fieldset className="mb_20">
                        <input
                          type="text"
                          placeholder="Address"
                          name="address"
                          value={address.address || ""}
                          onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          required
                        />
                      </fieldset>
                      <div className="tf-select mb_20">
                        <select
                          name="country"
                          value={address.country || "United States"}
                          onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          required
                        >
                          <option value="Australia">Australia</option>
                          <option value="Canada">Canada</option>
                          <option value="United States">United States</option>
                          <option value="France">France</option>
                          <option value="Germany">Germany</option>
                          <option value="Italy">Italy</option>
                          <option value="Japan">Japan</option>
                          <option value="Vietnam">Vietnam</option>
                        </select>
                      </div>
                      <fieldset className="mb_20">
                        <input
                          type="text"
                          placeholder="City"
                          name="city"
                          value={address.city || ""}
                          onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          required
                        />
                      </fieldset>
                      <div className="tf-cart-checkbox mb_20">
                        <div className="tf-checkbox-wrapp">
                          <input
                            type="checkbox"
                            id={`edit-address-default-${address.id || address._id}`}
                            name="isDefault"
                            checked={address.isDefault || false}
                            onChange={(e) => handleInputChange(e, true, address.id || address._id)}
                          />
                          <div>
                            <i className="icon-check"></i>
                          </div>
                        </div>
                        <label htmlFor={`edit-address-default-${address.id || address._id}`}>
                          Set as default address.
                        </label>
                      </div>
                      <div className="d-flex flex-column gap-20">
                        <button type="submit" className="tf-btn btn-fill radius-4">
                          <span className="text">Update address</span>
                        </button>
                        <span
                          onClick={() => handleEditToggle(address.id || address._id)}
                          className="tf-btn btn-fill radius-4 btn-hide-edit-address"
                        >
                          <span className="text">Cancel</span>
                        </span>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
