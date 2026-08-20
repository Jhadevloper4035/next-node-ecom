"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer1 from "@/components/footers/Footer1";
import { useToast } from "@/components/common/ToastContext";
import { createAddress, getAllAddresses } from "@/services/address/address.service";
import styles from "@/components/otherPages/Checkout.module.css";

const initialAddress = { label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" };

export default function CheckoutAddressPage() {
  const router = useRouter();
  const toast = useToast();
  const [address, setAddress] = useState(initialAddress);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getAllAddresses()
      .then((response) => {
        const list = response.data || [];
        setAddresses(list);
        setSelectedAddressId(String((list.find((item) => item.isDefault) || list[0])?._id || ""));
      })
      .catch(() => toast("Unable to load saved addresses.", "error"))
      .finally(() => setIsLoadingAddresses(false));
  }, [toast]);

  const saveAddress = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await createAddress(address);
      toast("Delivery address saved.", "success");
      router.replace(`/checkout?addressId=${response.data._id}`);
    } catch (error) {
      toast(error?.message || "Unable to save the address.", "error");
      setIsSaving(false);
    }
  };

  return <><section className={styles.page}><div className={styles.container}><div className={styles.header}><p>Secure checkout</p><h1>Delivery address</h1><span>Choose a saved address or add a new one for this order.</span></div><main className={styles.addressPageContent}>
    {!isLoadingAddresses && addresses.length > 0 && <section className={`${styles.card} ${styles.addressPicker}`}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>Saved addresses</p><h2>Choose where to deliver</h2></div><Link href="/checkout">Back to checkout</Link></div><div className={styles.addressList}>{addresses.map((item) => <label className={`${styles.address} ${selectedAddressId === String(item._id) ? styles.selected : ""}`} key={item._id}><input type="radio" name="savedAddress" value={item._id} checked={selectedAddressId === String(item._id)} onChange={(event) => setSelectedAddressId(event.target.value)} /><span><strong>{item.label || "Home"}{item.isDefault ? " · Default" : ""}</strong><small>{item.fullName} · {item.phone}</small><small>{item.line1}{item.line2 ? `, ${item.line2}` : ""}, {item.city}, {item.state} — {item.postalCode}</small></span></label>)}</div><Link href={`/checkout?addressId=${selectedAddressId}`} className={`${styles.primaryButton} ${styles.chooseAddressButton}`}>Use selected address</Link></section>}
    <form className={`${styles.card} ${styles.addressForm}`} onSubmit={saveAddress}>
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>New address</p><h2>Add a delivery address</h2></div></div>
    <div className={styles.formGrid}>{[["label", "Address label", "text"], ["fullName", "Full name", "text"], ["phone", "10-digit phone", "tel"], ["line1", "House / building and street", "text"], ["line2", "Area, locality (optional)", "text"], ["city", "City", "text"], ["state", "State", "text"], ["postalCode", "6-digit PIN code", "text"]].map(([name, placeholder, type]) => <input className={name === "line1" || name === "line2" ? styles.wide : ""} key={name} name={name} type={type} inputMode={name === "phone" || name === "postalCode" ? "numeric" : undefined} maxLength={name === "phone" ? 10 : name === "postalCode" ? 6 : undefined} placeholder={placeholder} value={address[name]} onChange={(event) => setAddress((current) => ({ ...current, [name]: (name === "phone" || name === "postalCode") ? event.target.value.replace(/\D/g, "") : event.target.value }))} required={!["line2"].includes(name)} />)}</div>
    <button className={styles.primaryButton} type="submit" disabled={isSaving}>{isSaving ? "Saving address…" : "Save and continue"}</button>
    </form></main></div></section><Footer1 /></>;
}
