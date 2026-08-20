"use client";

import React, { useEffect, useState } from "react";
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
import styles from "./Address.module.css";

const emptyAddress = {
  label: "",
  fullName: "",
  phone: "",
  alternatePhone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  isDefault: false,
};

export default function Address() {
  const dispatch = useDispatch();
  const { addresses, isLoading } = useSelector((state) => state.address);
  const toast = useToast();
  const [editingId, setEditingId] = useState(null);
  const [formAddress, setFormAddress] = useState(emptyAddress);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const closeModal = () => {
    if (!isLoading) {
      setIsModalOpen(false);
      setEditingId(null);
    }
  };

  const openNewAddress = () => {
    setEditingId(null);
    setFormAddress(emptyAddress);
    setIsModalOpen(true);
  };

  const openEditAddress = (address) => {
    setEditingId(address.id || address._id);
    setFormAddress({
      label: address.label || "",
      fullName: address.fullName || "",
      phone: address.phone || "",
      alternatePhone: address.alternatePhone || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      country: "India",
      postalCode: address.postalCode || "",
      isDefault: Boolean(address.isDefault),
    });
    setIsModalOpen(true);
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

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormAddress((currentAddress) => ({
      ...currentAddress,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(addressStart());

    try {
      const response = editingId
        ? await updateAddress(editingId, formAddress)
        : await createAddress(formAddress);
      const address = response.data || response;

      dispatch(editingId ? updateAddressSuccess(address) : addAddressSuccess(address));
      toast(editingId ? "Address updated successfully" : "Address added successfully", "success");
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      const msg = err?.message || `Failed to ${editingId ? "update" : "add"} address`;
      dispatch(addressFailure(msg));
      toast(msg, "error");
    }
  };

  return (
    <div className="my-account-content">
      <div className="account-address">
        <div className={`widget-inner-address ${styles.addressBook}`}>
          <div className={styles.toolbar}>
            <div>
              <p>Address book</p>
              <h2>Saved addresses</h2>
            </div>
            <button className={styles.addButton} type="button" onClick={openNewAddress}>
              Add new address
            </button>
          </div>

          {isLoading && !isModalOpen ? (
            <div className="text-center p-4">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className={styles.emptyState}>
              No addresses saved yet. Add your delivery address to continue.
            </div>
          ) : (
            <div className={styles.addressList}>
              {addresses.map((address) => {
                const addressId = address.id || address._id;

                return (
                  <article className={styles.addressCard} key={addressId}>
                    <div className={styles.addressLabel}>
                      <span>{address.label || "Home"}</span>
                      {address.isDefault && <small>Default</small>}
                    </div>
                    <div className={styles.addressDetails}>
                      <strong>{address.fullName}</strong>
                      <span>
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        {address.landmark ? `, ${address.landmark}` : ""}
                      </span>
                      <span>
                        {address.city}, {address.state} {address.postalCode}, {address.country}
                      </span>
                      <small>
                        {address.phone}
                        {address.alternatePhone ? ` · Alt: ${address.alternatePhone}` : ""}
                      </small>
                    </div>
                    <div className={styles.addressActions}>
                      <button className={styles.editButton} type="button" onClick={() => openEditAddress(address)}>
                        Edit
                      </button>
                      <button className={styles.deleteButton} type="button" onClick={() => handleDelete(addressId)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalBackdrop} onMouseDown={closeModal}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p>{editingId ? "Update saved address" : "New delivery address"}</p>
                <h2 id="address-modal-title">{editingId ? "Edit address" : "Add a new address"}</h2>
              </div>
              <button className={styles.closeButton} type="button" onClick={closeModal} aria-label="Close address form">
                ×
              </button>
            </div>

            <form className={styles.addressForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  Address label
                  <input name="label" value={formAddress.label} onChange={handleInputChange} maxLength="30" placeholder="Home, Work, etc." />
                </label>
                <label className={styles.field}>
                  Full name
                  <input name="fullName" value={formAddress.fullName} onChange={handleInputChange} maxLength="80" autoComplete="name" placeholder="Name for delivery" required />
                </label>
                <label className={styles.field}>
                  Phone number
                  <input name="phone" value={formAddress.phone} onChange={handleInputChange} inputMode="numeric" pattern="[0-9]{10}" maxLength="10" autoComplete="tel" placeholder="10-digit mobile number" required />
                </label>
                <label className={styles.field}>
                  Alternate phone
                  <input name="alternatePhone" value={formAddress.alternatePhone || ""} onChange={handleInputChange} inputMode="numeric" pattern="[0-9]{10}" maxLength="10" autoComplete="tel" placeholder="Optional" />
                </label>
                <label className={`${styles.field} ${styles.fullWidth}`}>
                  Address line 1
                  <input name="line1" value={formAddress.line1} onChange={handleInputChange} maxLength="120" autoComplete="address-line1" placeholder="House number, street and area" required />
                </label>
                <label className={`${styles.field} ${styles.fullWidth}`}>
                  Address line 2
                  <input name="line2" value={formAddress.line2 || ""} onChange={handleInputChange} maxLength="120" autoComplete="address-line2" placeholder="Apartment, floor, etc. (optional)" />
                </label>
                <label className={`${styles.field} ${styles.fullWidth}`}>
                  Landmark
                  <input name="landmark" value={formAddress.landmark || ""} onChange={handleInputChange} maxLength="80" placeholder="Optional" />
                </label>
                <label className={styles.field}>
                  City
                  <input name="city" value={formAddress.city} onChange={handleInputChange} maxLength="60" autoComplete="address-level2" placeholder="City" required />
                </label>
                <label className={styles.field}>
                  State
                  <input name="state" value={formAddress.state} onChange={handleInputChange} maxLength="60" autoComplete="address-level1" placeholder="State" required />
                </label>
                <label className={styles.field}>
                  PIN code
                  <input name="postalCode" value={formAddress.postalCode} onChange={handleInputChange} inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="postal-code" placeholder="6-digit PIN code" required />
                </label>
                <label className={styles.field}>
                  Country
                  <input value="India" readOnly aria-readonly="true" />
                </label>
              </div>

              <label className={styles.defaultToggle}>
                <input name="isDefault" type="checkbox" checked={formAddress.isDefault} onChange={handleInputChange} />
                <span>Set as my default address</span>
              </label>

              <div className={styles.modalActions}>
                <button className={styles.cancelButton} type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className={styles.saveButton} type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingId ? "Update address" : "Save address"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
