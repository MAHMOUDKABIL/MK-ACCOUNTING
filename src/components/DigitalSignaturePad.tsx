import { Check, Download, Eraser, FileCheck, Image as ImageIcon, PenTool, RefreshCw, Stamp, Trash2, Upload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { AuditorStatement } from '../types/accounting';

interface DigitalSignaturePadProps {
  auditorStatement: AuditorStatement;
  onUpdateAuditorStatement: (statement: AuditorStatement) => void;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  auditorStatement,
  onUpdateAuditorStatement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a'); // default black/obsidian
  const [penWidth, setPenWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeMode, setActiveMode] = useState<'draw' | 'upload'>('draw');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  }, [penColor, penWidth]);

  // Start Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Draw stroke
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop Drawing
  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
  };

  // Clear Canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Save Canvas Signature
  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    onUpdateAuditorStatement({
      ...auditorStatement,
      auditorSignature: signatureDataUrl,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Upload Signature Image File
  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdateAuditorStatement({
          ...auditorStatement,
          auditorSignature: result,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload Stamp / Seal Image File
  const handleStampFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdateAuditorStatement({
          ...auditorStatement,
          auditorStamp: result,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Signature
  const handleRemoveSignature = () => {
    onUpdateAuditorStatement({
      ...auditorStatement,
      auditorSignature: undefined,
    });
    clearCanvas();
  };

  // Remove Stamp
  const handleRemoveStamp = () => {
    onUpdateAuditorStatement({
      ...auditorStatement,
      auditorStamp: undefined,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-300 p-5 shadow-xs space-y-5 text-zinc-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-zinc-900 text-white rounded-lg">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 font-cairo">
              التوقيع الرقمي والختم الرسمي لمراقب الحسابات
            </h3>
            <p className="text-xs text-zinc-500">
              يتم إدراج التوقيع والختم آلياً في تقارير المراجعة، القوائم المالية، والشهادات المحاسبية المعتمدة
            </p>
          </div>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-lg animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            تم حفظ الاعتماد بنجاح
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Signature Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-zinc-600" />
              <span>توقيع مراقب الحسابات: {auditorStatement.auditorName || 'محمود الباز قابيل'}</span>
            </label>

            {/* Mode Switcher */}
            <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-300 text-xs">
              <button
                type="button"
                onClick={() => setActiveMode('draw')}
                className={`px-3 py-1 font-bold rounded-md transition-colors cursor-pointer ${
                  activeMode === 'draw' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                رسم باليد
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`px-3 py-1 font-bold rounded-md transition-colors cursor-pointer ${
                  activeMode === 'upload' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                رفع صورة
              </button>
            </div>
          </div>

          {activeMode === 'draw' ? (
            <div className="space-y-3">
              {/* Canvas Area */}
              <div className="relative border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50 p-2 text-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-white rounded-lg border border-zinc-200 cursor-crosshair touch-none shadow-inner"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-zinc-400 text-xs">
                    وقع هنا بالماوس أو القلم أو اللمس
                  </div>
                )}
              </div>

              {/* Drawing Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-600">اللون:</span>
                  <button
                    type="button"
                    onClick={() => setPenColor('#0f172a')}
                    className={`w-6 h-6 rounded-full bg-zinc-900 border-2 cursor-pointer ${
                      penColor === '#0f172a' ? 'border-zinc-500 ring-2 ring-zinc-400' : 'border-transparent'
                    }`}
                    title="أسود داكن"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#1e3a8a')}
                    className={`w-6 h-6 rounded-full bg-blue-900 border-2 cursor-pointer ${
                      penColor === '#1e3a8a' ? 'border-blue-500 ring-2 ring-blue-400' : 'border-transparent'
                    }`}
                    title="أزرق ملكي"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#000000')}
                    className={`w-6 h-6 rounded-full bg-black border-2 cursor-pointer ${
                      penColor === '#000000' ? 'border-zinc-400 ring-2 ring-zinc-300' : 'border-transparent'
                    }`}
                    title="أسود خالص"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex items-center gap-1 text-xs text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSignature}
                    disabled={!hasDrawn}
                    className="flex items-center gap-1.5 text-xs text-white bg-zinc-900 hover:bg-black font-bold px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>اعتماد وحفظ التوقيع</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50 p-6 text-center space-y-3">
              <Upload className="w-8 h-8 text-zinc-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-zinc-800">اختر صورة التوقيع الرقمي من جهازك</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">يدعم صور بصيغة PNG بخلفية شفافة، أو JPG أو SVG</p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span>اختيار ملف صورة التوقيع</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleSignatureFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Current Saved Signature Preview */}
          {auditorStatement.auditorSignature && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-24 h-14 bg-white border border-zinc-300 rounded-lg p-1 flex items-center justify-center shadow-2xs">
                  <img
                    src={auditorStatement.auditorSignature}
                    alt="التوقيع الرقمي المعتمد"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">التوقيع الرقمي المعتمد حالياً</span>
                  <span className="text-[11px] text-zinc-500">مدرج في جميع الشهادات والتقارير المالية</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveSignature}
                className="text-zinc-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="حذف التوقيع"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Office Seal / Stamp Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <Stamp className="w-4 h-4 text-zinc-600" />
              <span>الختم الرسمي للمكتب (س.م.م 44887)</span>
            </label>
          </div>

          <div className="border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50 p-6 text-center space-y-3">
            <Stamp className="w-8 h-8 text-zinc-400 mx-auto" />
            <div>
              <p className="text-xs font-bold text-zinc-800">رفع صورة الختم الرسمي للمكتب أو الخاتم البيضاوي</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">يفضل صورة دائرية أو بيضاوية شفافة PNG</p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors">
              <Upload className="w-4 h-4" />
              <span>رفع صورة الختم الرسمي</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleStampFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Current Saved Stamp Preview */}
          {auditorStatement.auditorStamp ? (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white border border-zinc-300 rounded-full p-1 flex items-center justify-center shadow-2xs">
                  <img
                    src={auditorStatement.auditorStamp}
                    alt="الختم الرسمي للمكتب"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">الختم الرسمي للمكتب</span>
                  <span className="text-[11px] text-zinc-500">س.م.م 44887 - سجل المحاسبين والمراجعين</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveStamp}
                className="text-zinc-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="حذف الختم"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center text-xs text-zinc-500">
              لم يتم رفع ختم رسمي مخصص بعد. سيتم استخدام الختم النصي القياسي المعتمد تلقائياً.
            </div>
          )}

          {/* Live Official Verification Seal Box */}
          <div className="border border-zinc-300 rounded-xl p-4 bg-white space-y-2 text-right">
            <span className="text-[11px] font-bold text-zinc-500 block">معاينة الاعتماد في نهاية التقارير:</span>
            <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50/50 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs font-black text-zinc-900">{auditorStatement.auditorName || 'محمود الباز قابيل'}</p>
                <p className="text-[11px] text-zinc-600">{auditorStatement.auditorTitle || 'محاسب ومراجع قانوني'}</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5 font-bold">
                  {auditorStatement.registerNumber || 'س.م.م 44887'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {auditorStatement.auditorSignature && (
                  <img
                    src={auditorStatement.auditorSignature}
                    alt="توقيع"
                    className="h-10 max-w-[90px] object-contain"
                  />
                )}
                {auditorStatement.auditorStamp ? (
                  <img
                    src={auditorStatement.auditorStamp}
                    alt="ختم"
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-800 text-center leading-tight p-0.5">
                    ختم المكتب<br />44887
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
