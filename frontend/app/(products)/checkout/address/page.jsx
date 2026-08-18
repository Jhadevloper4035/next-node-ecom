"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer1 from "@/components/footers/Footer1";
import { useToast } from "@/components/common/ToastContext";
import { createAddress } from "@/services/address/address.service";
import styles from "@/components/otherPages/Checkout.module.css";

const initialAddress = { label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" };

export default function CheckoutAddressPage() {
  const router = useRouter();
  const toast = useToast();
  const [address, setAddress] = useState(initialAddress);
  const [isSaving, setIsSaving] = useState(false);

  const saveAddress = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createAddress(address);
      toast("Delivery address saved.", "success");
      router.replace("/checkout");
    } catch (error) {
      toast(error?.message || "Unable to save the address.", "error");
      setIsSaving(false);
    }
  };

  return <><section className={styles.page}><div className={styles.container}><header className={styles.header}><p>Secure checkout</p><h1>Add delivery address</h1><span>This address is saved securely to your account for future orders.</span></header><form className={`${styles.card} ${styles.addressForm}`} onSubmit={saveAddress}>
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Delivery details</p><h2>Where should we deliver?</h2></div><Link href="/checkout">Back to checkout</Link></div>
    <div className={styles.formGrid}>{[["label", "Address label", "text"], ["fullName", "Full name", "text"], ["phone", "10-digit phone", "tel"], ["line1", "House / building and street", "text"], ["line2", "Area, locality (optional)", "text"], ["city", "City", "text"], ["state", "State", "text"], ["postalCode", "6-digit PIN code", "text"]].map(([name, placeholder, type]) => <input className={name === "line1" || name === "line2" ? styles.wide : ""} key={name} name={name} type={type} inputMode={name === "phone" || name === "postalCode" ? "numeric" : undefined} maxLength={name === "phone" ? 10 : name === "postalCode" ? 6 : undefined} placeholder={placeholder} value={address[name]} onChange={(event) => setAddress((current) => ({ ...current, [name]: (name === "phone" || name === "postalCode") ? event.target.value.replace(/\D/g, "") : event.target.value }))} required={!["line2"].includes(name)} />)}</div>
    <button className={styles.primaryButton} type="submit" disabled={isSaving}>{isSaving ? "Saving address…" : "Save and continue"}</button>
  </form></div></section><Footer1 /></>;
}
