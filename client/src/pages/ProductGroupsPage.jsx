import React, { useState } from 'react';
import useSWR from 'swr';
import {
    Loader2,
    ChevronDown,
    ChevronUp,
    Search,
    Package,
    Scale,
    DollarSign,
    Layers,
    Grid,
    Hash,
    AlertCircle,
    XCircle,
    HelpCircle,
    Filter,
    CheckCircle,
    X
} from 'lucide-react';
import Fetch from "../middlewares/fetcher";

export const ProductGroupsPage = () => {
    // Состояния для поиска
    const [keyInput, setKeyInput] = useState('');
    const [singleMode, setSingleMode] = useState(false);
    const [queryParams, setQueryParams] = useState({});

    // Состояния для UI
    const [expandedGroups, setExpandedGroups] = useState({}); // { "pattern_readyTrue": true/false, "pattern_readyFalse": ... }
    const [expandedUngrouped, setExpandedUngrouped] = useState({ readyTrue: false, readyFalse: false });
    const [activeTab, setActiveTab] = useState('readyTrue'); // 'readyTrue' или 'readyFalse'
    const [showInstructions, setShowInstructions] = useState(false);

    // SWR запрос
    const { data, error, isLoading, mutate } = useSWR(
        ['/product-groups', queryParams],
        () => {
            const params = new URLSearchParams();
            if (queryParams.key) params.append('key', queryParams.key);
            if (queryParams.single) params.append('single', 'true');
            const url = '/product-groups' + (params.toString() ? `?${params.toString()}` : '');
            return Fetch.get(url);
        },
        {
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    // Обработчики
    const handleSubmit = (e) => {
        e.preventDefault();
        setQueryParams({
            key: keyInput.trim(),
            single: singleMode ? 'true' : undefined,
        });
        setExpandedGroups({});
        setExpandedUngrouped({ readyTrue: false, readyFalse: false });
    };

    const handleClear = () => {
        setKeyInput('');
        setSingleMode(false);
        setQueryParams({});
        setExpandedGroups({});
        setExpandedUngrouped({ readyTrue: false, readyFalse: false });
    };

    const toggleGroup = (pattern, ready) => {
        const key = `${pattern}_${ready}`;
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleUngrouped = (ready) => {
        setExpandedUngrouped(prev => ({ ...prev, [ready]: !prev[ready] }));
    };

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('uz-Cyrl').format(num);
    };

    // Парсинг введённых ключей
    const parsedKeys = keyInput
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

    // Загрузка
    if (isLoading && !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600 text-lg">Маълумотлар юкланмоқда...</p>
                </div>
            </div>
        );
    }

    // Ошибка
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-gray-800 mt-4">Хатолик юз берди</h2>
                    <p className="text-gray-600 mt-2">{error.message}</p>
                    <button
                        onClick={() => mutate()}
                        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Қайта уриниш
                    </button>
                </div>
            </div>
        );
    }

    // Данные
    const { overallSummary, data: sectionData, mode } = data?.data || {};

    const readyTrue = sectionData?.readyTrue || {};
    const readyFalse = sectionData?.readyFalse || {};

    // Активная вкладка
    const activeSection = activeTab === 'readyTrue' ? readyTrue : readyFalse;

    // Функция для рендера группы
    const renderGroup = (group, ready) => {
        const groupKey = `${group.pattern}_${ready}`;
        const isExpanded = expandedGroups[groupKey];

        return (
            <div key={groupKey} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                {/* Заголовок группы */}
                <div
                    className="p-5 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleGroup(group.pattern, ready)}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Hash className="h-5 w-5 text-blue-700" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{group.pattern}</h2>
                            <span className="bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                {group.totalProducts} та маҳсулот
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Scale className="h-4 w-4" />
                                    {formatNumber(group.totalKg)} кг
                                </span>
                                <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {formatNumber(group.priceTotals?.uz?.value)} сўм
                                </span>
                            </div>
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                        </div>
                    </div>

                    {/* Краткая статистика для мобильных */}
                    <div className="sm:hidden flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <Scale className="h-4 w-4" />
                            {formatNumber(group.totalKg)} кг
                        </span>
                        <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatNumber(group.priceTotals?.uz?.value)} сўм
                        </span>
                        <span className="flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            {formatNumber(group.totalStock)} дона
                        </span>
                    </div>

                    {/* Полная статистика (мини) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs text-gray-500">
                        <div>Умумий кг: {formatNumber(group.totalKg)}</div>
                        <div>Умумий захира: {formatNumber(group.totalStock)}</div>
                        <div>Умумий нарх: {formatNumber(group.priceTotals?.uz?.value)} сўм</div>
                        <div>Ўлчов бирликлари: {Object.keys(group.unitTotals || {}).join(', ') || 'дона'}</div>
                    </div>
                </div>

                {/* Развернутая информация */}
                {isExpanded && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Гуруҳдаги маҳсулотлар ({group.products.length})
                        </h3>

                        <div className="space-y-3">
                            {group.products.map((product) => (
                                <div key={product._id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-800 break-words">
                                                {product.title || 'Номсиз маҳсулот'}
                                            </h4>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Layers className="h-3.5 w-3.5" />
                                                    Захира: {formatNumber(product.stock)} {product.unit || 'дона'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    Нарх: {formatNumber(product.price)} {product.priceType === 'en' ? '$' : 'сўм'}
                                                </span>
                                                {product.count !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Hash className="h-3.5 w-3.5" />
                                                        Сони: {formatNumber(product.count)}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <span className={`w-2 h-2 rounded-full ${product.priceType === 'en' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                                    {product.priceType === 'en' ? 'Export' : 'Uz'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Дополнительная статистика группы */}
                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="text-gray-500">Ўлчов бирликлари бўйича</div>
                                {Object.entries(group.unitTotals || {}).map(([unit, total]) => (
                                    <div key={unit} className="flex justify-between mt-1">
                                        <span>{unit}:</span>
                                        <span className="font-medium">{formatNumber(total)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="text-gray-500">Нарх тури бўйича</div>
                                <div className="flex justify-between mt-1">
                                    <span>Uz:</span>
                                    <span className="font-medium">{formatNumber(group.priceTotals?.uz?.value)} {group.priceTotals?.uz?.currency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>En:</span>
                                    <span className="font-medium">{formatNumber(group.priceTotals?.en?.value)} {group.priceTotals?.en?.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Рендер непривязанных продуктов
    const renderUngrouped = (products, ready) => {
        if (!products || products.length === 0) return null;
        const isExpanded = expandedUngrouped[ready];

        return (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mt-4">
                <div
                    className="p-5 bg-gradient-to-r from-orange-50 to-white cursor-pointer hover:bg-orange-50 transition-colors"
                    onClick={() => toggleUngrouped(ready)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Package className="h-5 w-5 text-orange-700" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Гуруҳланмаган маҳсулотлар</h2>
                            <span className="bg-orange-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                {products.length} та
                            </span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50">
                        <div className="space-y-3">
                            {products.map((product) => (
                                <div key={product._id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                    <h4 className="font-medium text-gray-800">{product.title || 'Номсиз маҳсулот'}</h4>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                                        <span>Захира: {formatNumber(product.stock)} {product.unit || 'дона'}</span>
                                        <span>Нарх: {formatNumber(product.price)} {product.priceType === 'en' ? '$' : 'сўм'}</span>
                                        {product.count !== undefined && <span>Сони: {formatNumber(product.count)}</span>}
                                        <span>Тип: {product.priceType === 'en' ? 'Export' : 'Uz'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Шапка с инструкцией */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <Package className="h-8 w-8 text-blue-600" />
                                Маҳсулот гуруҳлари
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Маҳсулотларни автоматик ёки қўлда киритилган калитлар бўйича гуруҳлаш
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInstructions(true)}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            <HelpCircle className="h-5 w-5" />
                            Қандай ишлатиш?
                        </button>
                    </div>

                    {/* Форма поиска */}
                    <form onSubmit={handleSubmit} className="mt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="keyInput" className="block text-sm font-medium text-gray-700 mb-1">
                                    Калитлар (вергул билан ажратинг)
                                </label>
                                <input
                                    type="text"
                                    id="keyInput"
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    placeholder="Масалан: 150D, B., 200D"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {parsedKeys.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {parsedKeys.map((key, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                            >
                                                <Hash className="h-3 w-3" />
                                                {key}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-end gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={singleMode}
                                        onChange={(e) => setSingleMode(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span>Ягона режим (фақат биринчи калит бўйича)</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Қидириш
                                </button>

                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Тозалаш
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Информация о текущем режиме */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            Режим: {mode === 'auto' && 'Автоматик'}
                            {mode === 'manual-keys' && 'Қўлда киритилган калитлар'}
                            {mode === 'single-key' && 'Ягона калит'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Основной контент */}
            <div className="container mx-auto px-4 py-8">
                {/* Общая статистика */}
                {overallSummary && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Filter className="h-5 w-5 text-blue-600" />
                            Умумий статистика
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-gray-500">Жами маҳсулотлар</div>
                                <div className="text-2xl font-bold">{formatNumber(overallSummary.totalProducts)}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-gray-500">Умумий кг</div>
                                <div className="text-2xl font-bold">{formatNumber(overallSummary.totalKg)}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-gray-500">Умумий захира</div>
                                <div className="text-2xl font-bold">{formatNumber(overallSummary.totalStock)}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-gray-500">Умумий нарх</div>
                                <div className="text-2xl font-bold">{formatNumber(overallSummary.priceTotals?.uz?.value)} сўм</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Вкладки Tayyor / Tayyor emas */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('readyTrue')}
                        className={`flex items-center gap-2 py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'readyTrue'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <CheckCircle className="h-4 w-4" />
                        Тайёр маҳсулотлар
                    </button>
                    <button
                        onClick={() => setActiveTab('readyFalse')}
                        className={`flex items-center gap-2 py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'readyFalse'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <X className="h-4 w-4" />
                        Тайёр эмас
                    </button>
                </div>

                {/* Возможные ключи (быстрый поиск) */}
                {activeSection.possibleKeys && activeSection.possibleKeys.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Топилган калитлар:</h3>
                        <div className="flex flex-wrap gap-2">
                            {activeSection.possibleKeys.map((key) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setKeyInput(key);
                                        setQueryParams({ key, single: false });
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded-full transition-colors"
                                >
                                    <Hash className="h-3 w-3" />
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Группы */}
                {activeSection.groups && activeSection.groups.length > 0 && (
                    <div className="space-y-4">
                        {activeSection.groups.map((group) => renderGroup(group, activeTab))}
                    </div>
                )}

                {/* Непривязанные продукты */}
                {activeSection.unGroupedProducts && renderUngrouped(activeSection.unGroupedProducts, activeTab)}

                {/* Если ничего нет */}
                {(!activeSection.groups || activeSection.groups.length === 0) &&
                    (!activeSection.unGroupedProducts || activeSection.unGroupedProducts.length === 0) && (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <Package className="h-16 w-16 text-gray-400 mx-auto" />
                            <h3 className="text-xl font-medium text-gray-700 mt-4">Маҳсулотлар топилмади</h3>
                            <p className="text-gray-500 mt-2">Калитларни ўзгартириб қайта уриниб кўринг.</p>
                        </div>
                    )}
            </div>

            {/* Модальное окно инструкции */}
            {showInstructions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <HelpCircle className="h-6 w-6 text-blue-600" />
                                    Қандай ишлатиш?
                                </h2>
                                <button onClick={() => setShowInstructions(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    <strong>Автоматик режим:</strong> ҳеч қандай калит киритмасангиз, маҳсулотлар номидан
                                    &quot;150D&quot;, &quot;B.&quot;, &quot;A107&quot; каби кодлар автоматик топилиб, гуруҳланади.
                                </p>
                                <p>
                                    <strong>Қўлда киритиш:</strong> Калитларни вергул билан ажратиб киритинг (масалан: 150D, B., A107).
                                    Ҳар бир калит бўйича алоҳида гуруҳ яратилади.
                                </p>
                                <p>
                                    <strong>Ягона режим:</strong> фақат биринчи калит бўйича фильтрлайди (гуруҳламайди).
                                </p>
                                <p>
                                    <strong>Тайёр / Тайёр эмас:</strong> маҳсулотларнинг &quot;ready&quot; ҳолатига қараб икки гуруҳга
                                    ажратилган. Ҳар бир бўлимда гуруҳланган ва гуруҳланмаган маҳсулотларни кўришингиз мумкин.
                                </p>
                                <p>
                                    <strong>Калитларни босиш:</strong> &quot;Топилган калитлар&quot; рўйхатидаги калитни боссангиз,
                                    у автоматик қидирувга қўйилади.
                                </p>
                                <p className="bg-blue-50 p-3 rounded-lg text-sm">
                                    Эслатма: ҳар бир маҳсулот фақат бир марта гуруҳланади (агар бир неча калитга мос келса, биринчиси
                                    олинади).
                                </p>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowInstructions(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
                                >
                                    Тушунарли
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
