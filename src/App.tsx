/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  FileDown, 
  Calculator, 
  User, 
  Briefcase, 
  HardHat, 
  Package, 
  Utensils, 
  CheckCircle, 
  Info,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as docx from 'docx';
import { saveAs } from 'file-saver';
import { cn } from './lib/utils';

// --- Types ---

interface MaterialRow {
  id: string;
  description: string;
  quantity: number | '';
  unit: string;
  unitPrice: number | '';
}

interface LaborRow {
  id: string;
  description: string;
  cost: number | '';
}

interface WorkerRow {
  id: string;
  name: string;
}

interface DietRow {
  id: string;
  workersCount: number | '';
  days: number | '';
  costPerDay: number | '';
}

interface BudgetData {
  projectName: string;
  beneficiary: string;
  workers: WorkerRow[];
  materials: MaterialRow[];
  labor: LaborRow[];
  dietEntries: DietRow[];
  approverName: string;
  approvalDate: string;
  observations: string;
}

// --- Constants ---

const UNITS = [
  'unidad', 'bolsa', 'kg', 'm', 'm²', 'm³', 'l', 'juego', 'caja', 'otro'
];

const INITIAL_DATA: BudgetData = {
  projectName: '',
  beneficiary: '',
  workers: [
    { id: crypto.randomUUID(), name: '' },
    { id: crypto.randomUUID(), name: '' }
  ],
  materials: Array.from({ length: 8 }, () => ({
    id: crypto.randomUUID(),
    description: '',
    quantity: '',
    unit: '',
    unitPrice: ''
  })),
  labor: Array.from({ length: 5 }, () => ({
    id: crypto.randomUUID(),
    description: '',
    cost: ''
  })),
  dietEntries: [
    { id: crypto.randomUUID(), workersCount: '', days: '', costPerDay: '' }
  ],
  approverName: '',
  approvalDate: new Date().toISOString().split('T')[0],
  observations: ''
};

const TRANSLATIONS = {
  es: {
    title: "RESUMEN DE PRESUPUESTO",
    projectName: "Proyecto:",
    beneficiary: "Beneficiario:",
    mainWorker: "Albañil Principal:",
    materials: "MATERIALES UTILIZADOS",
    labor: "TRABAJOS REALIZADOS",
    diets: "DIETAS",
    materialsTotal: "TOTAL MATERIALES:",
    laborTotal: "TOTAL MANO DE OBRA:",
    dietsTotal: "TOTAL DIETAS:",
    finalTotal: "PRESUPUESTO TOTAL:",
    approvedBy: "Aprobado por:",
    date: "Fecha:",
    description: "Descripción",
    quantity: "Cantidad",
    unit: "Unidad",
    unitPrice: "Precio Unitario",
    total: "Total",
    workDescription: "Descripción del Trabajo",
    cost: "Costo",
    currency: "MN",
    observations: "Observaciones:",
    workers: "trabajadores",
    days: "días",
    perMeal: "por dieta"
  },
  en: {
    title: "BUDGET SUMMARY",
    projectName: "Project Name:",
    beneficiary: "Beneficiary:",
    mainWorker: "Main Worker:",
    materials: "MATERIALS USED",
    labor: "WORK PERFORMED",
    diets: "MEALS",
    materialsTotal: "TOTAL MATERIALS:",
    laborTotal: "TOTAL LABOR:",
    dietsTotal: "TOTAL MEALS:",
    finalTotal: "TOTAL BUDGET:",
    approvedBy: "Approved by:",
    date: "Date:",
    description: "Description",
    quantity: "Quantity",
    unit: "Unit",
    unitPrice: "Unit Price",
    total: "Total",
    workDescription: "Work Description",
    cost: "Cost",
    currency: "MN",
    observations: "Observations:",
    workers: "workers",
    days: "days",
    perMeal: "per meal"
  }
};

// --- Main Component ---

export default function App() {
  const [data, setData] = useState<BudgetData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Calculations ---

  const materialsTotal = useMemo(() => {
    return data.materials.reduce((acc, m) => {
      const qty = typeof m.quantity === 'number' ? m.quantity : 0;
      const price = typeof m.unitPrice === 'number' ? m.unitPrice : 0;
      return acc + (qty > 0 ? qty * price : price);
    }, 0);
  }, [data.materials]);

  const laborTotal = useMemo(() => {
    return data.labor.reduce((acc, l) => {
      const cost = typeof l.cost === 'number' ? l.cost : 0;
      return acc + cost;
    }, 0);
  }, [data.labor]);

  const dietTotal = useMemo(() => {
    return data.dietEntries.reduce((acc, entry) => {
      const workers = typeof entry.workersCount === 'number' ? entry.workersCount : 0;
      const days = typeof entry.days === 'number' ? entry.days : 0;
      const cost = typeof entry.costPerDay === 'number' ? entry.costPerDay : 0;
      return acc + (workers * days * cost);
    }, 0);
  }, [data.dietEntries]);

  const finalTotal = materialsTotal + laborTotal + dietTotal;

  // --- Handlers ---

  const updateField = (field: keyof BudgetData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateWorker = (id: string, value: string) => {
    setData(prev => ({
      ...prev,
      workers: prev.workers.map(w => w.id === id ? { ...w, name: value } : w)
    }));
  };

  const addWorker = () => {
    setData(prev => ({
      ...prev,
      workers: [...prev.workers, { id: crypto.randomUUID(), name: '' }]
    }));
  };

  const removeWorker = (id: string) => {
    setData(prev => ({
      ...prev,
      workers: prev.workers.filter(w => w.id !== id)
    }));
  };

  const updateMaterial = (id: string, field: keyof MaterialRow, value: any) => {
    setData(prev => ({
      ...prev,
      materials: prev.materials.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const addMaterial = () => {
    setData(prev => ({
      ...prev,
      materials: [...prev.materials, {
        id: crypto.randomUUID(),
        description: '',
        quantity: '',
        unit: '',
        unitPrice: ''
      }]
    }));
  };

  const removeMaterial = (id: string) => {
    setData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== id)
    }));
  };

  const updateLabor = (id: string, field: keyof LaborRow, value: any) => {
    setData(prev => ({
      ...prev,
      labor: prev.labor.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  };

  const addLabor = () => {
    setData(prev => ({
      ...prev,
      labor: [...prev.labor, {
        id: crypto.randomUUID(),
        description: '',
        cost: ''
      }]
    }));
  };

  const removeLabor = (id: string) => {
    setData(prev => ({
      ...prev,
      labor: prev.labor.filter(l => l.id !== id)
    }));
  };

  const updateDietEntry = (id: string, field: keyof DietRow, value: any) => {
    setData(prev => ({
      ...prev,
      dietEntries: prev.dietEntries.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const addDietEntry = () => {
    setData(prev => ({
      ...prev,
      dietEntries: [...prev.dietEntries, { id: crypto.randomUUID(), workersCount: '', days: '', costPerDay: '' }]
    }));
  };

  const removeDietEntry = (id: string) => {
    setData(prev => ({
      ...prev,
      dietEntries: prev.dietEntries.filter(e => e.id !== id)
    }));
  };

  const resetData = () => {
    if (window.confirm('¿Estás seguro de que deseas resetear todos los datos? Esta acción no se puede deshacer.')) {
      setData(INITIAL_DATA);
    }
  };

  // --- Word Export ---

  const exportToWord = async (lang: 'es' | 'en') => {
    setIsGenerating(true);
    const t = TRANSLATIONS[lang];

    try {
      const doc = new docx.Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 }
            }
          },
          children: [
            new docx.Paragraph({
              text: t.title,
              heading: docx.HeadingLevel.TITLE,
              alignment: docx.AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `${t.projectName} `, bold: true }),
                new docx.TextRun({ text: data.projectName || 'N/A' })
              ],
              spacing: { after: 100 }
            }),
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `${t.beneficiary} `, bold: true }),
                new docx.TextRun({ text: data.beneficiary || 'N/A' })
              ],
              spacing: { after: 100 }
            }),
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `${t.mainWorker} `, bold: true }),
                new docx.TextRun({ text: data.workers[0]?.name || 'N/A' })
              ],
              spacing: { after: 300 }
            }),

            // Materials Table
            new docx.Paragraph({
              text: t.materials,
              heading: docx.HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new docx.Table({
              width: { size: 100, type: docx.WidthType.PERCENTAGE },
              rows: [
                new docx.TableRow({
                  children: [
                    new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: t.description, bold: true })] })], shading: { fill: "F1F5F9" } }),
                    new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: t.quantity, bold: true })] })], shading: { fill: "F1F5F9" } }),
                    new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: t.unit, bold: true })] })], shading: { fill: "F1F5F9" } }),
                    new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: t.unitPrice, bold: true })] })], shading: { fill: "F1F5F9" } }),
                    new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: t.total, bold: true })] })], shading: { fill: "F1F5F9" } }),
                  ]
                }),
                ...data.materials
                  .filter(m => m.description || m.unitPrice)
                  .map(m => {
                    const qty = typeof m.quantity === 'number' ? m.quantity : 0;
                    const price = typeof m.unitPrice === 'number' ? m.unitPrice : 0;
                    const total = qty > 0 ? qty * price : price;
                    return new docx.TableRow({
                      children: [
                        new docx.TableCell({ children: [new docx.Paragraph(m.description || '-')] }),
                        new docx.TableCell({ children: [new docx.Paragraph(m.quantity.toString() || '-')] }),
                        new docx.TableCell({ children: [new docx.Paragraph(m.unit || '-')] }),
                        new docx.TableCell({ children: [new docx.Paragraph(`$${price.toFixed(2)}`)] }),
                        new docx.TableCell({ children: [new docx.Paragraph(`$${total.toFixed(2)}`)] }),
                      ]
                    });
                  })
              ]
            }),
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `${t.materialsTotal} `, bold: true }),
                new docx.TextRun({ text: `$${materialsTotal.toFixed(2)} ${t.currency}` })
              ],
              alignment: docx.AlignmentType.RIGHT,
              spacing: { before: 100, after: 200 }
            }),

            // Labor Table
            new docx.Paragraph({
              text: t.labor,
              heading: docx.HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new docx.Table({
              width: { size: 100, type: docx.WidthType.PERCENTAGE },
              rows: [
                new docx.TableRow({
                  children: [
                    new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: t.workDescription, bold: true })] })], shading: { fill: "F1F5F9" } }),
                    new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: t.cost, bold: true })] })], shading: { fill: "F1F5F9" } }),
                  ]
                }),
                ...data.labor
                  .filter(l => l.description || l.cost)
                  .map(l => new docx.TableRow({
                    children: [
                      new docx.TableCell({ children: [new docx.Paragraph(l.description || '-')] }),
                      new docx.TableCell({ children: [new docx.Paragraph(`$${(typeof l.cost === 'number' ? l.cost : 0).toFixed(2)}`)] }),
                    ]
                  }))
              ]
            }),
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `${t.laborTotal} `, bold: true }),
                new docx.TextRun({ text: `$${laborTotal.toFixed(2)} ${t.currency}` })
              ],
              alignment: docx.AlignmentType.RIGHT,
              spacing: { before: 100, after: 200 }
            }),

            // Diets
            new docx.Paragraph({
              text: t.diets,
              heading: docx.HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            ...data.dietEntries
              .filter(e => e.workersCount || e.days || e.costPerDay)
              .map(e => new docx.Paragraph({
                children: [
                  new docx.TextRun({ 
                    text: `${e.workersCount || 0} ${t.workers} × ${e.days || 0} ${t.days} × $${(typeof e.costPerDay === 'number' ? e.costPerDay : 0).toFixed(2)} ${t.perMeal}` 
                  })
                ]
              })),
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `${t.dietsTotal} `, bold: true }),
                new docx.TextRun({ text: `$${dietTotal.toFixed(2)} ${t.currency}` })
              ],
              alignment: docx.AlignmentType.RIGHT,
              spacing: { before: 100, after: 300 }
            }),

            // Final Total
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `${t.finalTotal} `, bold: true, size: 28 }),
                new docx.TextRun({ text: `$${finalTotal.toFixed(2)} ${t.currency}`, bold: true, size: 28 })
              ],
              alignment: docx.AlignmentType.CENTER,
              spacing: { before: 400, after: 400 }
            }),

            // Observations
            ...(data.observations ? [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({ text: t.observations, bold: true }),
                ],
                spacing: { before: 200 }
              }),
              new docx.Paragraph({
                text: data.observations,
                spacing: { after: 400 }
              })
            ] : []),

            // Approval
            new docx.Table({
              width: { size: 100, type: docx.WidthType.PERCENTAGE },
              borders: docx.TableBorders.NONE,
              rows: [
                new docx.TableRow({
                  children: [
                    new docx.TableCell({
                      children: [
                        new docx.Paragraph({
                          children: [
                            new docx.TextRun({ text: `${t.approvedBy} `, bold: true }),
                            new docx.TextRun({ text: data.approverName || '________________' })
                          ],
                          spacing: { after: 400 }
                        }),
                        new docx.Paragraph({ text: "_________________________" }),
                        new docx.Paragraph({ text: lang === 'es' ? "Firma" : "Signature", alignment: docx.AlignmentType.CENTER })
                      ]
                    }),
                    new docx.TableCell({
                      children: [
                        new docx.Paragraph({
                          children: [
                            new docx.TextRun({ text: `${t.date} `, bold: true }),
                            new docx.TextRun({ text: data.approvalDate || '________________' })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }]
      });

      const blob = await docx.Packer.toBlob(doc);
      const fileName = `${data.projectName || 'Presupuesto'}_${lang}.docx`.replace(/\s+/g, '_');
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error al generar el documento Word.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Calculator size={24} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">Presupuesto Pro</h1>
              <p className="text-xs text-slate-500 font-medium">Gestión de Proyectos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={resetData}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mr-2"
              title="Resetear datos"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={() => exportToWord('es')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              <FileDown size={18} />
              <span>Español</span>
            </button>
            <button 
              onClick={() => exportToWord('en')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-sm transition-all shadow-md shadow-slate-500/10 disabled:opacity-50"
            >
              <FileDown size={18} />
              <span>English</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Info */}
            <section className="section-card">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Briefcase size={20} />
                </div>
                <h2 className="font-bold text-slate-800">Información General</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Proyecto</label>
                  <input 
                    type="text" 
                    value={data.projectName}
                    onChange={(e) => updateField('projectName', e.target.value)}
                    placeholder="Ej: Construcción de cuarto adicional"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Beneficiario Directo</label>
                  <input 
                    type="text" 
                    value={data.beneficiary}
                    onChange={(e) => updateField('beneficiary', e.target.value)}
                    placeholder="Nombre del beneficiario"
                    className="input-field"
                  />
                </div>
              </div>
            </section>

            {/* Workers */}
            <section className="section-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <HardHat size={20} />
                  </div>
                  <h2 className="font-bold text-slate-800">Trabajadores</h2>
                </div>
                <button 
                  onClick={addWorker}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Añadir trabajador"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence initial={false}>
                  {data.workers.map((worker, idx) => (
                    <motion.div 
                      key={worker.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                        <span>{idx === 0 ? 'Trabajador Principal' : `Trabajador ${idx + 1}`}</span>
                        {idx > 0 && (
                          <button 
                            onClick={() => removeWorker(worker.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={worker.name}
                          onChange={(e) => updateWorker(worker.id, e.target.value)}
                          className="input-field pl-10"
                          placeholder="Nombre completo"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* Materials */}
            <section className="section-card overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Package size={20} />
                  </div>
                  <h2 className="font-bold text-slate-800">Materiales</h2>
                </div>
                <button 
                  onClick={addMaterial}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Añadir material"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción</th>
                      <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">Cant.</th>
                      <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28">Unidad</th>
                      <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">P. Unit</th>
                      <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">Total</th>
                      <th className="px-6 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {data.materials.map((m) => {
                        const qty = typeof m.quantity === 'number' ? m.quantity : 0;
                        const price = typeof m.unitPrice === 'number' ? m.unitPrice : 0;
                        const total = qty > 0 ? qty * price : price;
                        
                        return (
                          <motion.tr 
                            key={m.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td className="px-6 py-2">
                              <input 
                                type="text" 
                                value={m.description}
                                onChange={(e) => updateMaterial(m.id, 'description', e.target.value)}
                                className="w-full bg-transparent focus:outline-none text-sm placeholder:text-slate-300"
                                placeholder="Ej: Cemento P-350"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                type="number" 
                                value={m.quantity}
                                onChange={(e) => updateMaterial(m.id, 'quantity', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-full bg-transparent focus:outline-none text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select 
                                value={m.unit}
                                onChange={(e) => updateMaterial(m.id, 'unit', e.target.value)}
                                className="w-full bg-transparent focus:outline-none text-sm appearance-none cursor-pointer"
                              >
                                <option value="">-</option>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                type="number" 
                                value={m.unitPrice}
                                onChange={(e) => updateMaterial(m.id, 'unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-full bg-transparent focus:outline-none text-sm"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs font-bold text-slate-600">
                              ${total.toFixed(2)}
                            </td>
                            <td className="px-6 py-2">
                              <button 
                                onClick={() => removeMaterial(m.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Labor */}
            <section className="section-card overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Calculator size={20} />
                  </div>
                  <h2 className="font-bold text-slate-800">Mano de Obra</h2>
                </div>
                <button 
                  onClick={addLabor}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Añadir trabajo"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción del Trabajo</th>
                      <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-40 text-right">Costo (MN)</th>
                      <th className="px-6 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {data.labor.map((l) => (
                        <motion.tr 
                          key={l.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td className="px-6 py-2">
                            <input 
                              type="text" 
                              value={l.description}
                              onChange={(e) => updateLabor(l.id, 'description', e.target.value)}
                              className="w-full bg-transparent focus:outline-none text-sm placeholder:text-slate-300"
                              placeholder="Ej: Levantado de muro de carga"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input 
                              type="number" 
                              value={l.cost}
                              onChange={(e) => updateLabor(l.id, 'cost', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full bg-transparent focus:outline-none text-sm text-right font-mono font-bold"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-6 py-2">
                            <button 
                              onClick={() => removeLabor(l.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Diets */}
            <section className="section-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <Utensils size={20} />
                  </div>
                  <h2 className="font-bold text-slate-800">Dietas (Alimentación)</h2>
                </div>
                <button 
                  onClick={addDietEntry}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Añadir dieta"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {data.dietEntries.map((entry, idx) => (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="relative p-4 border border-slate-100 rounded-xl bg-slate-50/50"
                    >
                      {idx > 0 && (
                        <button 
                          onClick={() => removeDietEntry(entry.id)}
                          className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-colors z-10"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cant. Trabajadores</label>
                          <input 
                            type="number" 
                            value={entry.workersCount}
                            onChange={(e) => updateDietEntry(entry.id, 'workersCount', e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="input-field"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Días de Trabajo</label>
                          <input 
                            type="number" 
                            value={entry.days}
                            onChange={(e) => updateDietEntry(entry.id, 'days', e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="input-field"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Costo p/ Dieta (MN)</label>
                          <input 
                            type="number" 
                            value={entry.costPerDay}
                            onChange={(e) => updateDietEntry(entry.id, 'costPerDay', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="input-field"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              <div className="mt-6 p-4 bg-rose-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-bold text-rose-900">Total Dietas</span>
                <span className="font-mono font-bold text-rose-600">${dietTotal.toFixed(2)} MN</span>
              </div>
            </section>

            {/* Approval */}
            <section className="section-card">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle size={20} />
                </div>
                <h2 className="font-bold text-slate-800">Aprobación</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Aprobador</label>
                  <input 
                    type="text" 
                    value={data.approverName}
                    onChange={(e) => updateField('approverName', e.target.value)}
                    className="input-field"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Aprobación</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="date" 
                      value={data.approvalDate}
                      onChange={(e) => updateField('approvalDate', e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Observations */}
            <section className="section-card">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <Info size={20} />
                </div>
                <h2 className="font-bold text-slate-800">Observaciones</h2>
              </div>
              
              <textarea 
                value={data.observations}
                onChange={(e) => updateField('observations', e.target.value)}
                className="input-field min-h-[120px]"
                placeholder="Anote aquí cualquier consideración adicional..."
              />
            </section>
          </div>

          {/* Right Column: Summary Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <section className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Resumen de Costos</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Materiales</span>
                    <span className="font-mono font-medium">${materialsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Mano de Obra</span>
                    <span className="font-mono font-medium">${laborTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Dietas</span>
                    <span className="font-mono font-medium">${dietTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Total Presupuesto</span>
                        <span className="text-3xl font-bold tracking-tighter">${finalTotal.toFixed(2)}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 mb-1">MN</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 space-y-3">
                  <button 
                    onClick={() => exportToWord('es')}
                    disabled={isGenerating}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generando...' : 'Exportar Word (ES)'}
                    {!isGenerating && <FileDown size={18} />}
                  </button>
                  <button 
                    onClick={() => exportToWord('en')}
                    disabled={isGenerating}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Export Word (EN)'}
                    {!isGenerating && <FileDown size={18} />}
                  </button>
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Info size={16} />
                  Consejo
                </h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Asegúrese de completar la descripción de los materiales y trabajos para que aparezcan correctamente en el documento exportado.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
