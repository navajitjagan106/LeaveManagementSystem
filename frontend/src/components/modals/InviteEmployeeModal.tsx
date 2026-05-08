import { useState, useEffect } from "react";
import { sendInvitation, getEmployees, getPolicies, bulkUpload } from "../../api/managementApi";
import { getAvailableRoles } from "../../api/permissionsApi";
import { useToast } from "../common/ToastContext";
import { ManagerCombobox } from "../common/ManagerCombobox";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    X, Upload, Download, Info, CheckCircle2,
    XCircle, RefreshCw, Play
} from "lucide-react";
import { Field, FieldLabel } from "../ui/field";
import { Progress } from "../ui/progress";

const SAMPLE_CSV = `name,email,role,department,manager_email,policy_name
Sarah Jenkins,sarah.jenkins@example.com,manager,Product Development,,Senior Leave Policy
Michael Scott,michael.scott@example.com,manager,Sales,,Standard Leave Policy
Jim Halpert,jim.halpert@example.com,employee,Sales,michael.scott@example.com,Standard Leave Policy
Pam Beesly,pam.beesly@example.com,employee,Sales,michael.scott@example.com,Standard Leave Policy
Dwight Schrute,dwight.schrute@example.com,employee,Sales,michael.scott@example.com,Standard Leave Policy
Angela Martin,angela.martin@example.com,hr,Finance,sarah.jenkins@example.com,Standard Leave Policy`;

const InviteEmployeeModal = ({ onClose, onSuccess }: any) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

    // Single Form State
    const [form, setForm] = useState({
        name: "", email: "", role: "employee", department: "",
        manager_id: "" as number | "", policy_id: "", expires_in_hours: "48",
    });
    const [managers, setManagers] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>(["employee"]);
    const [loading, setLoading] = useState(false);

    // Bulk State
    const [csvText, setCsvText] = useState("");
    const [bulkLoading, setBulkLoading] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [progressValue, setProgressValue] = useState(0);

    useEffect(() => {
        getEmployees()
            .then((empRes) => {
                const empList = empRes.data?.data || [];
                setManagers(empList);
            })
            .catch(() => {
                console.log("Unable to fetch managers list due to permission restrictions.");
            });

        getPolicies()
            .then((polRes) => {
                setPolicies(polRes.data?.data || []);
            })
            .catch(() => {
                console.log("Unable to fetch policies list due to permission restrictions.");
            });

        getAvailableRoles()
            .then((roleRes) => {
                const fetchedRoles = roleRes.data?.data;
                if (fetchedRoles && fetchedRoles.length > 0) {
                    const updatedRoles = [...fetchedRoles];
                    const hasAdmin = updatedRoles.some(r => (typeof r === "string" ? r : r.name) === "admin");
                    if (!hasAdmin) {
                        updatedRoles.push("admin");
                    }
                    setRoles(updatedRoles);
                }
            })
            .catch(() => {
                console.log("Using default fallback roles list due to permission restrictions.");
            });
    }, []);


    const handleSingleSubmit = async () => {
        if (!form.name) { toast.warning("Full name is required"); return; }
        if (!form.email) { toast.warning("Email is required"); return; }
        try {
            setLoading(true);
            await sendInvitation({
                name: form.name,
                email: form.email,
                role: form.role,
                department: form.department || undefined,
                manager_id: form.manager_id !== "" ? Number(form.manager_id) : undefined,
                policy_id: form.policy_id ? Number(form.policy_id) : undefined,
                expires_in_hours: Number(form.expires_in_hours),
            });
            toast.success("Invitation sent!");
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    // Bulk action handlers
    const handleLoadSample = () => {
        setCsvText(SAMPLE_CSV);
        toast.success("Sample template loaded!");
    };

    const handleClearBulk = () => {
        setCsvText("");
        setResults(null);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (!file.name.endsWith(".csv")) {
            toast.error("Please upload a valid .csv file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setCsvText(text);
            toast.success("CSV file loaded successfully!");
        };
        reader.readAsText(file);
    };

    const handleBulkSubmit = async () => {
        if (!csvText.trim()) {
            toast.warning("Please paste CSV data or upload a file first");
            return;
        }

        let interval: any;
        try {
            setBulkLoading(true);
            setProgressValue(0);

            interval = setInterval(() => {
                setProgressValue((prev) => {
                    if (prev >= 95) return prev;
                    return prev + Math.floor(Math.random() * 10) + 5;
                });
            }, 150);

            const res = await bulkUpload(csvText);

            if (interval) clearInterval(interval);
            setProgressValue(100);

            setResults(res.data.summary);
            toast.success("Bulk import complete!");
            onSuccess?.(); // Instantly refresh table lists
        } catch (err: any) {
            if (interval) clearInterval(interval);
            setProgressValue(0);
            toast.error(err?.response?.data?.error || "Failed to process bulk upload");
        } finally {
            setBulkLoading(false);
        }
    };

    const downloadSampleFile = () => {
        const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "leave_ms_bulk_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const SectionHeading = ({ label }: { label: string }) => (
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
    );

    return (
        <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <SheetContent className="p-0 border-l-0 shadow-2xl flex flex-col w-full bg-white h-full overflow-hidden transition-all duration-300 sm:max-w-[540px]">
                {/* ── Header ── */}
                <div className="px-6 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <SheetHeader className="text-left">
                        <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                                <SheetTitle className="text-lg font-bold text-gray-900">
                                    {activeTab === "bulk" ? "Bulk Employee Import" : "Invite Employee"}
                                </SheetTitle>
                                <SheetDescription className="text-sm text-gray-500 font-medium mt-0.5">
                                    {activeTab === "bulk"
                                        ? "Upload or paste a CSV file to register and invite multiple employees simultaneously."
                                        : "Employee will receive an email link to set up their account and password."}
                                </SheetDescription>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </SheetHeader>
                </div>

                {/* ── Tabs Selector ── */}
                <div className="px-6 pt-3 bg-white border-b border-gray-100 flex gap-6">
                    <button
                        onClick={() => {
                            setActiveTab("single");
                            setResults(null);
                        }}
                        className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition-all ${
                            activeTab === "single"
                                ? "border-primary text-primary font-extrabold"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        Single Invitation
                    </button>
                    <button
                        onClick={() => setActiveTab("bulk")}
                        className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition-all ${
                            activeTab === "bulk"
                                ? "border-primary text-primary font-extrabold"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        Bulk CSV Upload
                    </button>
                </div>

                {/* ── Scrollable Body Area ── */}
                <div className="px-6 py-6 flex-1 overflow-y-auto bg-white min-h-0">
                    {activeTab === "single" ? (
                        /* SINGLE INVITATION FORM */
                        <div className="space-y-6">
                            {/* Personal Info */}
                            <div className="space-y-3">
                                <SectionHeading label="Personal Info" />
                                <Input
                                    placeholder="Full name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="bg-white border-gray-200 text-gray-800 rounded-xl focus-visible:ring-primary-light"
                                />
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="bg-white border-gray-200 text-gray-800 rounded-xl focus-visible:ring-primary-light"
                                />
                                <Input
                                    placeholder="Department (optional)"
                                    value={form.department}
                                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                                    className="bg-white border-gray-200 text-gray-800 rounded-xl focus-visible:ring-primary-light"
                                />
                            </div>

                            {/* Role & Manager */}
                            <div className="space-y-3">
                                <SectionHeading label="Role & Manager" />
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors capitalize"
                                >
                                    {roles.map((r) => {
                                        const rVal = typeof r === "string" ? r : r.name;
                                        const rLabel = typeof r === "string"
                                            ? r.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
                                            : r.label || r.name;
                                        return (
                                            <option key={rVal} value={rVal}>
                                                {rLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ManagerCombobox
                                    value={form.manager_id}
                                    onChange={(id) => setForm({ ...form, manager_id: id })}
                                    managers={managers}
                                    placeholder="No Manager"
                                />
                            </div>

                            {/* Employment Level */}
                            <div className="space-y-3">
                                <SectionHeading label="Employment Level" />
                                <select
                                    value={form.policy_id}
                                    onChange={(e) => setForm({ ...form, policy_id: e.target.value })}
                                    className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors"
                                >
                                    <option value="">No policy (set later)</option>
                                    {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <p className="text-xs text-gray-400 font-medium leading-normal">
                                    Leave allocations will be applied automatically based on the selected policy
                                </p>
                            </div>

                            {/* Link Expiry */}
                            <div className="space-y-3">
                                <SectionHeading label="Link Expiry" />
                                <select
                                    value={form.expires_in_hours}
                                    onChange={(e) => setForm({ ...form, expires_in_hours: e.target.value })}
                                    className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors"
                                >
                                    <option value="24">24 hours</option>
                                    <option value="48">48 hours (default)</option>
                                    <option value="72">72 hours</option>
                                    <option value="168">7 days</option>
                                </select>
                            </div>
                        </div>
                    ) : results ? (
                        /* BULK SUMMARY STATS & RESULTS */
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                    Bulk Upload Summary
                                </h3>
                                <button
                                    onClick={handleClearBulk}
                                    className="px-4 py-2 bg-primary-light text-primary rounded-xl text-xs font-bold hover:bg-primary-light transition-all flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                    <RefreshCw size={12} />
                                    Upload Another Batch
                                </button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                                    <p className="text-2xl font-extrabold text-gray-800 mt-1">{results.total}</p>
                                </div>
                                <div className="bg-primary-lightmerald-50/50 border border-emerald-100 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Invited</p>
                                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">{results.successCount}</p>
                                </div>
                                <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Failed</p>
                                    <p className="text-2xl font-extrabold text-red-600 mt-1">{results.failedCount}</p>
                                </div>
                                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Success Rate</p>
                                    <p className="text-2xl font-extrabold text-primary mt-1">
                                        {results.total > 0 ? Math.round((results.successCount / results.total) * 100) : 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Blockers */}
                            {results.failedCount > 0 && (
                                <div className="bg-red-50/70 border border-red-200/60 rounded-xl p-5 space-y-3">
                                    <div className="flex items-center gap-1.5">
                                        <XCircle className="text-red-500" size={16} />
                                        <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                                            Dependency & Structural Blockers ({results.failedCount})
                                        </h4>
                                    </div>
                                    <p className="text-xs text-red-700 font-medium">
                                        The following records could not be invited due to hierarchy, manager, or role anomalies.
                                    </p>
                                    <div className="divide-y divide-red-100/40 bg-white rounded-lg border border-red-100/50 overflow-hidden text-xs max-h-52 overflow-y-auto">
                                        {results.processed.filter((r: any) => r.status === "failed").map((r: any, idx: number) => (
                                            <div key={idx} className="p-3 flex justify-between gap-4 hover:bg-red-50/10">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-800">{r.name}</p>
                                                    <p className="text-gray-400 mt-0.5">{r.email}</p>
                                                </div>
                                                <span className="text-red-600 font-semibold text-right leading-tight max-w-[200px] sm:max-w-xs">{r.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Details table */}
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden text-xs">
                                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                                    Processed Invitation Records
                                </div>
                                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase bg-gray-50/30">
                                                <th className="px-4 py-2.5">Name / Email</th>
                                                <th className="px-4 py-2.5">Role</th>
                                                <th className="px-4 py-2.5">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {results.processed.map((r: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/30">
                                                    <td className="px-4 py-2.5">
                                                        <p className="font-semibold text-gray-800">{r.name}</p>
                                                        <p className="text-gray-400 mt-0.5">{r.email}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5 capitalize">{r.role}</td>
                                                    <td className="px-4 py-2.5">
                                                        {r.status === "invited" ? (
                                                            <span className="text-emerald-600 font-semibold bg-primary-lightmerald-50 px-2 py-0.5 rounded-full">Invited</span>
                                                        ) : (
                                                            <span className="text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Failed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* BULK SUBMIT SINGLE COLUMN VIEW */
                        <div className="space-y-6">
                            {/* Drag and Drop */}
                            <div
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                    dragActive
                                        ? "border-primary bg-primary-light/50"
                                        : "border-gray-200 hover:border-primary hover:bg-gray-50/30"
                                }`}
                            >
                                <div className="w-10 h-10 bg-primary-light text-primary rounded-xl flex items-center justify-center mb-3 shadow-sm">
                                    <Upload size={18} />
                                </div>
                                <h4 className="text-xs font-bold text-gray-800 mb-1">Drag and drop your CSV file here</h4>
                                <p className="text-[10px] text-gray-400 mb-3">or click below to browse your documents</p>
                                <label className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[11px] font-bold shadow transition-colors cursor-pointer">
                                    Browse Files
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileInput}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Raw Editor */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Raw CSV text editor
                                    </label>
                                    <div className="flex gap-2 text-[10px] font-semibold text-primary">
                                        <button onClick={handleLoadSample} className="hover:underline">Load Sample</button>
                                        <span>•</span>
                                        <button onClick={downloadSampleFile} className="hover:underline flex items-center gap-0.5">
                                            <Download size={10} /> Template
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    placeholder="name,email,role,department,manager_email,policy_name&#10;Alice Jenkins,alice@example.com,manager,Design,,Senior Leave Policy..."
                                    value={csvText}
                                    onChange={(e) => setCsvText(e.target.value)}
                                    className="w-full h-44 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors placeholder:text-gray-300"
                                />
                            </div>

                            {/* Progress bar during bulk upload */}
                            {bulkLoading && (
                                <div className="bg-primary-light/40 rounded-xl p-3 border border-primary-light space-y-2">
                                    <Field className="w-full">
                                        <FieldLabel htmlFor="progress-upload" className="text-[10px] font-bold text-purple-950 flex items-center">
                                            <span>Importing & Emailing Employees...</span>
                                            <span className="ml-auto text-primary font-extrabold">{progressValue}%</span>
                                        </FieldLabel>
                                        <Progress value={progressValue} id="progress-upload" />
                                    </Field>
                                </div>
                            )}

                            {/* Specifications instructions */}
                            <div className="bg-primary-light/20 rounded-xl border border-primary-light/40 p-4 space-y-2.5 text-xs text-purple-950/85">
                                <div className="flex items-center gap-1.5">
                                    <Info className="text-primary-light0 shrink-0" size={14} />
                                    <h5 className="font-bold text-[10px] text-purple-950 uppercase tracking-wide">CSV Specifications</h5>
                                </div>
                                <ul className="space-y-1.5 text-[11px] list-disc list-inside leading-normal">
                                    <li><strong>name</strong> (Required): Employee full name.</li>
                                    <li><strong>email</strong> (Required): Work email for login.</li>
                                    <li><strong>role</strong> (Required): standard system role or custom role key (e.g. <code className="bg-primary-light/40 px-1 py-0.5 rounded text-primary-dark">employee</code>).</li>
                                    <li><strong>manager_email</strong> (Optional): Supervisor email.</li>
                                    <li><strong>policy_name</strong> (Optional): Matching leave policy.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0 z-10">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 py-2.5 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-150 transition-colors bg-white"
                    >
                        {results ? "Close" : "Cancel"}
                    </Button>
                    {activeTab === "single" ? (
                        <Button
                            onClick={handleSingleSubmit}
                            disabled={loading}
                            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold shadow hover:shadow-primary-light transition-all"
                        >
                            {loading ? "Sending…" : "Send Invitation"}
                        </Button>
                    ) : !results ? (
                        <Button
                            onClick={handleBulkSubmit}
                            disabled={bulkLoading}
                            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold shadow hover:shadow-primary-light transition-all flex items-center justify-center gap-1.5"
                        >
                            {bulkLoading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={14} />
                                    Processing…
                                </>
                            ) : (
                                <>
                                    <Play size={14} />
                                    Import & Invite
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold shadow hover:shadow-primary-light transition-all"
                        >
                            Done
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default InviteEmployeeModal;
