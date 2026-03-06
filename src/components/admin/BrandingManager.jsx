import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../App';
import { GalleryBold, PaletteBold, BuildingsBold } from 'solar-icon-set';

const BrandingManager = () => {
    const { tenantId, tenantData } = useTenant();
    const { showToast, ToastComponent } = useToast();

    const [name, setName] = useState(tenantData?.name || '');
    const [primaryColor, setPrimaryColor] = useState(tenantData?.branding?.primary_color || '#00b894');
    const [headerColor, setHeaderColor] = useState(tenantData?.branding?.header_color || '#00b894');
    const [logoUrl, setLogoUrl] = useState(tenantData?.branding?.logo_url || '');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (tenantData) {
            setName(tenantData.name || '');
            setPrimaryColor(tenantData.branding?.primary_color || '#00b894');
            setHeaderColor(tenantData.branding?.header_color || '#00b894');
            setLogoUrl(tenantData.branding?.logo_url || '');
        }
    }, [tenantData]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !tenantId) return;

        setUploading(true);
        const storageRef = ref(storage, `tenants/${tenantId}/logo_${Date.now()}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                showToast("Logo upload failed.", "danger");
                setUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setLogoUrl(downloadURL);
                    setUploading(false);
                    showToast("Logo uploaded! Don't forget to save changes.", "info");
                });
            }
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!tenantId) return;
        setProcessing(true);
        try {
            const tenantRef = doc(db, 'tenants', tenantId);
            await updateDoc(tenantRef, {
                name: name.trim(),
                'branding.primary_color': primaryColor,
                'branding.header_color': headerColor,
                'branding.logo_url': logoUrl.trim() || null,
                updated_at: new Date()
            });
            showToast("Branding settings saved!", "success");

            // Note: The TenantContext will automatically pick up the changes
            // and update the CSS variables.
        } catch (err) {
            showToast("Failed to save branding.", "danger");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="box fadeIn">
            <h2 className="title is-4 mb-4">
                <span className="icon mr-2"><PaletteBold size={20} /></span>
                Business Branding
            </h2>

            {ToastComponent}

            <form onSubmit={handleSave}>
                <div className="columns is-multiline">
                    <div className="column is-6">
                        <div className="field">
                            <label className="label">Business Name</label>
                            <div className="control has-icons-left">
                                <input
                                    className="input"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. My Awesome Bakery"
                                    required
                                />
                                <span className="icon is-left"><BuildingsBold size={16} /></span>
                            </div>
                        </div>
                    </div>

                    <div className="column is-6">
                        <div className="field">
                            <label className="label">Primary Brand Color</label>
                            <div className="control is-flex is-align-items-center">
                                <input
                                    className="input mr-2"
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    style={{ width: '60px', height: '40px', padding: '2px' }}
                                />
                                <input
                                    className="input"
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    placeholder="#000000"
                                />
                            </div>
                            <p className="help">This color will be used for buttons, links, and highlights.</p>
                        </div>
                    </div>

                    <div className="column is-6">
                        <div className="field">
                            <label className="label">Header / Theme Color</label>
                            <div className="control is-flex is-align-items-center">
                                <input
                                    className="input mr-2"
                                    type="color"
                                    value={headerColor}
                                    onChange={(e) => setHeaderColor(e.target.value)}
                                    style={{ width: '60px', height: '40px', padding: '2px' }}
                                />
                                <input
                                    className="input"
                                    type="text"
                                    value={headerColor}
                                    onChange={(e) => setHeaderColor(e.target.value)}
                                    placeholder="#000000"
                                />
                            </div>
                            <p className="help">This color will be used for the top bar and mobile headers.</p>
                        </div>
                    </div>

                    <div className="column is-12">
                        <div className="field">
                            <label className="label">Logo Image</label>
                            <div className="control">
                                <div className={`file has-name is-fullwidth ${uploading ? 'is-loading' : ''}`}>
                                    <label className="file-label">
                                        <input className="file-input" type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                        <span className="file-cta">
                                            <span className="file-icon"><GalleryBold size={18} /></span>
                                            <span className="file-label">Choose a file…</span>
                                        </span>
                                        <span className="file-name">
                                            {uploading ? `Uploading ${Math.round(uploadProgress)}%` : (logoUrl ? 'Logo selected' : 'No file chosen')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            {logoUrl && (
                                <div className="mt-3">
                                    <p className="is-size-7 has-text-grey mb-1">Preview:</p>
                                    <img src={logoUrl} alt="Logo Preview" style={{ maxHeight: '50px', borderRadius: '4px' }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        className={`button is-primary ${processing ? 'is-loading' : ''}`}
                        type="submit"
                    >
                        Save Changes
                    </button>
                    <div className="is-pulled-right">
                        <div
                            className="box is-shadowless"
                            style={{
                                background: primaryColor,
                                color: '#fff',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: 'bold'
                            }}
                        >
                            Brand Preview
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BrandingManager;
