import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { 
  Laptop, 
  Monitor, 
  Keyboard, 
  Headphones, 
  Smartphone, 
  HardDrive, 
  Cpu, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Calendar, 
  Wrench,
  Wifi,
  Battery,
  BatteryCharging,
  Globe,
  Tv,
  Activity
} from 'lucide-react';
import { Gadget } from '../../types';
import { useDeviceInfo } from '../../utils/useDeviceInfo';

export const GadgetInventoryModule: React.FC = () => {
  const { gadgets, addGadget, updateGadget, deleteGadget } = useAppContext();
  const toast = useToast();
  const deviceInfo = useDeviceInfo();

  // Filter and search state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGadget, setEditingGadget] = useState<Gadget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gadget | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Computers');
  const [formSpecs, setFormSpecs] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formIcon, setFormIcon] = useState('Laptop');
  const [formStatus, setFormStatus] = useState<'active' | 'maintenance' | 'retired'>('active');

  const categories = ['All', 'Computers', 'Displays', 'Peripherals', 'Audio', 'Storage', 'Other'];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-4 h-4 text-accent-purple" />;
      case 'Monitor': return <Monitor className="w-4 h-4 text-accent-purple" />;
      case 'Keyboard': return <Keyboard className="w-4 h-4 text-accent-purple" />;
      case 'Headphones': return <Headphones className="w-4 h-4 text-accent-purple" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4 text-accent-purple" />;
      case 'HardDrive': return <HardDrive className="w-4 h-4 text-accent-purple" />;
      default: return <Cpu className="w-4 h-4 text-accent-purple" />;
    }
  };

  const getStatusBadgeVariant = (status: 'active' | 'maintenance' | 'retired') => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'retired': return 'error';
    }
  };

  const getStatusLabel = (status: 'active' | 'maintenance' | 'retired') => {
    switch (status) {
      case 'active': return 'Працює (Active)';
      case 'maintenance': return 'Обслуговування';
      case 'retired': return 'Списано';
    }
  };

  const openAddModal = () => {
    setEditingGadget(null);
    setFormName('');
    setFormCategory('Computers');
    setFormSpecs('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormIcon('Laptop');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (gadg: Gadget) => {
    setEditingGadget(gadg);
    setFormName(gadg.name);
    setFormCategory(gadg.category);
    setFormSpecs(gadg.specs);
    setFormPurchaseDate(gadg.purchaseDate);
    setFormIcon(gadg.icon);
    setFormStatus(gadg.status);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.warning('Будь ласка, вкажіть назву пристрою');
      return;
    }

    const gadgetPayload = {
      name: formName,
      category: formCategory,
      specs: formSpecs,
      purchaseDate: formPurchaseDate,
      icon: formIcon,
      status: formStatus,
    };

    if (editingGadget) {
      updateGadget({
        ...editingGadget,
        ...gadgetPayload,
      });
      toast.success(`Пристрій "${formName}" успішно оновлено!`);
    } else {
      addGadget(gadgetPayload);
      toast.success(`Пристрій "${formName}" успішно додано до реєстру!`);
    }

    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteGadget(deleteTarget.id);
      toast.success(`Пристрій "${deleteTarget.name}" видалено з обліку`);
      setDeleteTarget(null);
    }
  };

  // Filter and search gadgets
  const filteredGadgets = gadgets.filter((g) => {
    const matchesCategory = selectedCategory === 'All' || g.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.specs.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">Gadget Inventory</h2>
          <p className="text-xs text-text-secondary">Облік та технічний нагляд особистого парку гаджетів та серверів.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto text-xs py-2">
          <Plus className="w-4 h-4" /> Додати Новий Пристрій
        </Button>
      </div>

      {/* Real Device Diagnostics */}
      {!deviceInfo.isAllowed ? (
        <Card className="p-6 bg-[#15131F] border border-[rgba(168,130,255,0.12)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="font-sans font-semibold text-sm text-[#EDEBF5]">Цей пристрій (Діагностика локального середовища)</h3>
              <p className="text-xs text-text-secondary">
                Ви можете дозволити визначення характеристик цього пристрою (кількість ядер CPU, ОЗУ, батарея, мережевий статус, GPU та версія ОС) для автоматичного аналізу та налаштування локального середовища.
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => {
                deviceInfo.allowDiagnostics();
                toast.success('Діагностика пристрою активована!');
              }}
              className="text-xs py-2 shrink-0 self-start md:self-auto bg-accent-purple text-white font-medium font-sans rounded-lg"
            >
              Визначити характеристики цього пристрою
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-[#15131F] border border-[rgba(168,130,255,0.12)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-border-accent/10 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent-purple/10 border border-accent-purple/20 rounded-xl text-accent-purple">
                <Laptop className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-accent-purple">Система</span>
                <h3 className="font-sans font-semibold text-sm text-[#EDEBF5]">Цей пристрій (Автоматична діагностика)</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${deviceInfo.online ? 'bg-[#7DD3A8]' : 'bg-status-error'} animate-pulse`} />
              <span className="text-[10px] font-mono text-[#8B879E]">
                {deviceInfo.online ? 'МЕРЕЖА: ОНЛАЙН' : 'МЕРЕЖА: ОФЛАЙН'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* OS & Browser */}
            <div className="bg-[#0B0A12]/40 p-3.5 rounded-xl border border-border-accent/10 flex items-start gap-3">
              <Globe className="w-5 h-5 text-accent-purple shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-[10px] text-text-tertiary font-mono uppercase">Платформа / Браузер</div>
                <div className="text-xs font-semibold text-text-primary">{deviceInfo.os || 'Unknown OS'}</div>
                <div className="text-[11px] text-[#8B879E] truncate max-w-[180px]" title={deviceInfo.browser || ''}>{deviceInfo.browser || 'Unknown Browser'}</div>
                {deviceInfo.language && (
                  <div className="text-[10px] font-mono text-text-tertiary mt-1">Мова: {deviceInfo.language}</div>
                )}
              </div>
            </div>

            {/* CPU & GPU */}
            <div className="bg-[#0B0A12]/40 p-3.5 rounded-xl border border-border-accent/10 flex items-start gap-3 col-span-1 lg:col-span-2">
              <Cpu className="w-5 h-5 text-accent-purple shrink-0 mt-0.5" />
              <div className="space-y-1 w-full overflow-hidden">
                <div className="text-[10px] text-text-tertiary font-mono uppercase">Апаратне забезпечення</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-text-primary">
                  {deviceInfo.cores && <span>Ядра: {deviceInfo.cores} vCPU</span>}
                  {deviceInfo.memory && <span>ОЗП: ~{deviceInfo.memory} GB</span>}
                </div>
                {deviceInfo.gpu && (
                  <div className="text-[10px] font-mono text-text-secondary truncate mt-1 w-full" title={deviceInfo.gpu}>
                    GPU: {deviceInfo.gpu}
                  </div>
                )}
                {deviceInfo.platform && (
                  <div className="text-[10px] font-mono text-text-tertiary">Архітектура: {deviceInfo.platform}</div>
                )}
              </div>
            </div>

            {/* Screen & Performance */}
            <div className="bg-[#0B0A12]/40 p-3.5 rounded-xl border border-border-accent/10 flex items-start gap-3">
              <Tv className="w-5 h-5 text-accent-purple shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-[10px] text-text-tertiary font-mono uppercase">Дисплей & Живлення</div>
                {deviceInfo.screen && (
                  <div className="text-xs font-semibold text-text-primary">
                    {deviceInfo.screen.width}x{deviceInfo.screen.height} <span className="text-[10px] text-text-secondary">@{deviceInfo.screen.pixelRatio}x</span>
                  </div>
                )}
                <div className="flex flex-col gap-1 mt-1">
                  {deviceInfo.battery && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary">
                      {deviceInfo.battery.charging ? (
                        <BatteryCharging className="w-3.5 h-3.5 text-[#7DD3A8]" />
                      ) : (
                        <Battery className="w-3.5 h-3.5 text-accent-purple" />
                      )}
                      <span>Батарея: {deviceInfo.battery.level}% {deviceInfo.battery.charging ? '(зарядка)' : ''}</span>
                    </div>
                  )}
                  {deviceInfo.network && deviceInfo.network.effectiveType && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary">
                      <Wifi className="w-3.5 h-3.5 text-accent-purple" />
                      <span>Зв'язок: {deviceInfo.network.effectiveType.toUpperCase()} ({deviceInfo.network.downlink} Mbps)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="border-t border-border-accent/10 pt-4">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">Мої пристрої</h3>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4 bg-panel-bg/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/30 glow-active'
                  : 'bg-hover-bg/30 text-text-secondary border-border-accent/10 hover:text-text-primary hover:bg-hover-bg/60'
              }`}
            >
              {cat === 'All' ? 'Всі гаджети' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Пошук за назвою або специфікацією..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-hover-bg/50 border border-border-accent rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/40"
          />
        </div>
      </Card>

      {/* Gadgets Grid */}
      {filteredGadgets.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border-accent/20 rounded-2xl bg-panel-bg/10">
          <Wrench className="w-10 h-10 text-text-tertiary mx-auto mb-3 stroke-[1.25]" />
          <h3 className="font-semibold text-sm text-text-primary">Пристроїв не знайдено</h3>
          <p className="text-xs text-text-secondary mt-1">Змініть фільтр пошуку або зареєструйте новий пристрій.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGadgets.map((gadg) => (
            <Card key={gadg.id} className="relative group overflow-hidden flex flex-col justify-between p-5">
              <div className="space-y-4">
                {/* Upper row: icon, category, actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-hover-bg border border-border-accent/55 rounded-xl text-accent-purple shrink-0">
                      {getIconComponent(gadg.icon)}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-text-tertiary">
                        {gadg.category}
                      </span>
                      <h4 className="font-sans font-semibold text-xs sm:text-sm text-text-primary group-hover:text-accent-purple transition-colors mt-0.5">
                        {gadg.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex gap-1.5 opacity-80 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(gadg)}
                      className="p-1.5 bg-hover-bg/60 border border-border-accent/30 rounded-lg text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-all cursor-pointer"
                      title="Редагувати"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(gadg)}
                      className="p-1.5 bg-status-error/10 border border-status-error/20 rounded-lg text-status-error hover:bg-status-error/20 transition-all cursor-pointer"
                      title="Видалити"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specs text */}
                <div className="p-3 rounded-lg bg-hover-bg/20 border border-border-accent/10 font-mono text-[11px] text-text-secondary min-h-[50px]">
                  {gadg.specs || 'Специфікації не вказані.'}
                </div>
              </div>

              {/* Lower row: specs details & purchase date */}
              <div className="mt-4 pt-3.5 border-t border-border-accent/15 flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                  <span>Придбано: {gadg.purchaseDate || 'Невідомо'}</span>
                </div>
                <Badge variant={getStatusBadgeVariant(gadg.status)}>
                  {getStatusLabel(gadg.status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Gadget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGadget ? 'Редагувати Пристрій' : 'Додати Новий Пристрій'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Назва пристрою *</Label>
            <Input 
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Наприклад, AirPods Pro 2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Категорія</Label>
              <Select 
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                <option value="Computers" className="bg-panel-bg">Комп'ютери (Computers)</option>
                <option value="Displays" className="bg-panel-bg">Дисплеї (Displays)</option>
                <option value="Peripherals" className="bg-panel-bg">Периферія (Peripherals)</option>
                <option value="Audio" className="bg-panel-bg">Аудіо (Audio)</option>
                <option value="Storage" className="bg-panel-bg">Накопичувачі (Storage)</option>
                <option value="Other" className="bg-panel-bg">Інше (Other)</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Іконка категорії</Label>
              <Select 
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
              >
                <option value="Laptop" className="bg-panel-bg">Laptop (Ноутбук)</option>
                <option value="Monitor" className="bg-panel-bg">Monitor (Дисплей)</option>
                <option value="Keyboard" className="bg-panel-bg">Keyboard (Клавіатура/Периферія)</option>
                <option value="Headphones" className="bg-panel-bg">Headphones (Навушники)</option>
                <option value="Smartphone" className="bg-panel-bg">Smartphone (Телефон)</option>
                <option value="HardDrive" className="bg-panel-bg">HardDrive (Диск/Storage)</option>
                <option value="Cpu" className="bg-panel-bg">Cpu (Комплектуючі)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Технічні характеристики (Специфікація)</Label>
            <Input 
              value={formSpecs}
              onChange={(e) => setFormSpecs(e.target.value)}
              placeholder="Опишіть характеристики: модель процесора, об'єм пам'яті тощо"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Дата придбання</Label>
              <Input 
                type="date"
                value={formPurchaseDate}
                onChange={(e) => setFormPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Технічний статус</Label>
              <Select 
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
              >
                <option value="active" className="bg-panel-bg">Працює (Active)</option>
                <option value="maintenance" className="bg-panel-bg">Обслуговування (Maintenance)</option>
                <option value="retired" className="bg-panel-bg">Списано / Продано (Retired)</option>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-border-accent/20 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Скасувати
            </Button>
            <Button variant="primary" type="submit">
              {editingGadget ? 'Зберегти зміни' : 'Додати пристрій'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Підтвердження видалення"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Ви дійсно бажаєте видалити пристрій <strong className="text-text-primary">"{deleteTarget?.name}"</strong> з обліку гаджетів? Цю дію неможливо скасувати.
          </p>
          <div className="pt-2 flex justify-end gap-3 border-t border-border-accent/20">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Скасувати
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Видалити
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
