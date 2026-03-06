import React, { useState, useEffect } from 'react';
import { getAllTenants, createTenant, updateTenantStatus } from '../../services/tenantService';
import { useToast } from '../../App';
import { SettingsBold, AddCircleBold, BuildingsBold, UserBold, ShieldCheckBold, RefreshSquareBold } from 'solar-icon-set';
import PageLayout from '../layout/PageLayout';

const SuperAdminDashboard = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTenantName, setNewTenantName] = useState('');
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const { showToast, ToastComponent } = useToast();

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const data = await getAllTenants();
            setTenants(data);
        } catch (err) {
            showToast("Failed to load tenants", "danger");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        if (!newTenantName || !newOwnerEmail) return;
        setProcessing(true);
        try {
            await createTenant(newTenantName, newOwnerEmail);
            showToast(`Tenant "${newTenantName}" provisioned! Invitation sent to ${newOwnerEmail}.`, "success");
            setNewTenantName('');
            setNewOwnerEmail('');
            loadTenants();
        } catch (err) {
            showToast(err.message, "danger");
        } finally {
            setProcessing(false);
        }
    };

    const handleToggleStatus = async (tenantId, currentStatus) => {
        const newStatus = currentStatus === 'active';
        try {
            await updateTenantStatus(tenantId, !newStatus);
            showToast("Tenant status updated", "success");
            loadTenants();
        } catch (err) {
            showToast("Update failed", "danger");
        }
    };

    return (
        <PageLayout
            title="Super-Admin Portal"
            subtitle="Provision and manage platform-level business tenants."
            icon={<ShieldCheckBold size={24} />}
        >
            {ToastComponent}

            <div className="columns is-multiline">
                {/* Provision New Tenant */}
                <div className="column is-12 is-4-desktop">
                    <div className="box card-gradient-primary has-text-white">
                        <h2 className="title is-4 has-text-white mb-4">
                            <span className="icon mr-2"><AddCircleBold /></span>
                            Provision Tenant
                        </h2>
                        <form onSubmit={handleCreateTenant}>
                            <div className="field">
                                <label className="label has-text-white">Business Name</label>
                                <div className="control">
                                    <input
                                        className="input is-medium"
                                        type="text"
                                        placeholder="e.g. Golden Crust Bakery"
                                        value={newTenantName}
                                        onChange={(e) => setNewTenantName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label className="label has-text-white">Owner Email</label>
                                <div className="control">
                                    <input
                                        className="input is-medium"
                                        type="email"
                                        placeholder="owner@business.com"
                                        value={newOwnerEmail}
                                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                className={`button is-white is-fullwidth is-medium ${processing ? 'is-loading' : ''}`}
                                type="submit"
                            >
                                Create Tenant
                            </button>
                        </form>
                    </div>
                </div>

                {/* Tenant List */}
                <div className="column is-12 is-8-desktop">
                    <div className="box">
                        <div className="level mb-4">
                            <div className="level-left">
                                <h2 className="title is-4 mb-0">Platform Tenants</h2>
                            </div>
                            <div className="level-right">
                                <button className="button is-small is-light" onClick={loadTenants}>
                                    <span className="icon"><RefreshSquareBold size={14} /></span>
                                    <span>Sync</span>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="has-text-centered py-6">
                                <span className="button is-loading is-white"></span>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table is-fullwidth is-hoverable">
                                    <thead>
                                        <tr>
                                            <th>Business Name</th>
                                            <th>Tenant ID</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.map(t => (
                                            <tr key={t.id}>
                                                <td className="is-vcentered">
                                                    <div className="is-flex is-align-items-center">
                                                        <span className="icon has-text-grey-light mr-2"><BuildingsBold size={18} /></span>
                                                        <span className="has-text-weight-bold">{t.name}</span>
                                                    </div>
                                                </td>
                                                <td className="is-vcentered is-family-monospace is-size-7">{t.id}</td>
                                                <td className="is-vcentered">
                                                    <span className={`tag ${t.status === 'active' ? 'is-success' : 'is-danger'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="is-vcentered">
                                                    <button
                                                        className={`button is-small ${t.status === 'active' ? 'is-danger' : 'is-success'}`}
                                                        onClick={() => handleToggleStatus(t.id, t.status)}
                                                    >
                                                        {t.status === 'active' ? 'Disable' : 'Enable'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default SuperAdminDashboard;
