import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DatabaseService from '../../services/DatabaseService';
import TimeTrackingService from '../timetracking/TimeTrackingService';

// Icônes
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon,
  ClockIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  ArrowUpIcon,
  TrendingDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  SparklesIcon,
  EyeIcon,
  PencilIcon,
  FireIcon,
  StarIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  BoltIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  // États pour stocker les données
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalClients: 0,
    activeClients: 0,
    totalContracts: 0,
    activeContracts: 0,
    endingSoonContracts: 0,
    contractsThisMonth: 0,
    revenueThisMonth: 0
  });
  
  const [timeTrackingStats, setTimeTrackingStats] = useState({
    totalHoursThisWeek: 0,
    totalHoursThisMonth: 0,
    pendingValidations: 0,
    totalRevenue: 0,
    activeEmployeesWorking: 0,
    productivity: 85,
    averageHoursPerDay: 7.5
  });
  
  const [chartData, setChartData] = useState({
    weeklyHours: [],
    monthlyRevenue: [],
    employeePerformance: [],
    contractsDistribution: [],
    revenueByClient: []
  });
  
  const [endingSoonContracts, setEndingSoonContracts] = useState([]);
  const [topEmployees, setTopEmployees] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Couleurs pour les graphiques
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];

  useEffect(() => {
    loadDashboardData();
    
    // Actualisation automatique toutes les 3 minutes
    const interval = setInterval(() => {
      refreshData();
    }, 3 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les données en parallèle
      await Promise.all([
        loadBasicStats(),
        loadTimeTrackingStats(),
        loadChartData(),
        loadTopEmployees(),
        loadRecentActivity()
      ]);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des données du tableau de bord:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBasicStats = async () => {
    const dashboardStats = await DatabaseService.getDashboardStats();
    setStats(dashboardStats);
    
    const endingContracts = await DatabaseService.getEndingSoonContracts();
    console.log("endingContracts    ------------------------ ", endingContracts);
    
    setEndingSoonContracts(endingContracts);
  };

  const loadTimeTrackingStats = async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const [weekEntries, monthEntries, pendingEntries] = await Promise.all([
        TimeTrackingService.getTimeEntries({
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }),
        TimeTrackingService.getTimeEntries({
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }),
        TimeTrackingService.getTimeEntries({ status: 'draft' })
      ]);
      
      const weekHours = weekEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
      const monthHours = monthEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
      const monthRevenue = monthEntries.reduce((sum, entry) => sum + ((entry.totalHours || 0) * (entry.billingRate || 0)), 0);
      const activeEmployees = new Set(weekEntries.map(entry => entry.employeeId)).size;
      
      // Calculer la productivité (simulation)
      const expectedHours = activeEmployees * 7 * 8; // 8h/jour * 7 jours
      const productivity = expectedHours > 0 ? Math.min((weekHours / expectedHours) * 100, 100) : 0;
      
      setTimeTrackingStats({
        totalHoursThisWeek: weekHours,
        totalHoursThisMonth: monthHours,
        pendingValidations: pendingEntries.length,
        totalRevenue: monthRevenue,
        activeEmployeesWorking: activeEmployees,
        productivity: Math.round(productivity),
        averageHoursPerDay: weekHours > 0 ? weekHours / 7 : 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des stats de pointage:', error);
    }
  };

  const loadChartData = async () => {
    try {
      // Récupérer tous les contrats
      const allContracts = await DatabaseService.getContracts();
      
      // Données pour les 7 derniers jours
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const weeklyData = await Promise.all(
        last7Days.map(async (date) => {
          const dateStr = date.toISOString().split('T')[0];
          const entries = await TimeTrackingService.getTimeEntries({
            startDate: dateStr,
            endDate: dateStr
          });
          
          const totalHours = entries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
          const revenue = entries.reduce((sum, entry) => sum + ((entry.totalHours || 0) * (entry.billingRate || 0)), 0);
          
          return {
            day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            hours: totalHours,
            revenue: Math.round(revenue),
            productivity: Math.min((totalHours / (8 * Math.max(1, new Set(entries.map(e => e.employeeId)).size))) * 100, 100)
          };
        })
      );

      // Données mensuelles (6 derniers mois)
      const last6Months = Array.from({length: 6}, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return date;
      });

      const monthlyData = await Promise.all(
        last6Months.map(async (date) => {
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const entries = await TimeTrackingService.getTimeEntries({
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0]
          });
          
          const revenue = entries.reduce((sum, entry) => sum + ((entry.totalHours || 0) * (entry.billingRate || 0)), 0);
          const hours = entries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
          
          return {
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            revenue: Math.round(revenue),
            hours: Math.round(hours),
            contracts: new Set(entries.map(e => e.contractId)).size
          };
        })
      );

      // Distribution des contrats par période
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const contractsDistribution = [
        { 
          name: 'En cours', 
          value: allContracts.filter(c => {
            const startDate = new Date(c.startDate);
            const endDate = new Date(c.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return startDate <= today && endDate >= today;
          }).length, 
          color: '#10B981' 
        },
        { 
          name: 'Terminés', 
          value: allContracts.filter(c => {
            const endDate = new Date(c.endDate);
            endDate.setHours(23, 59, 59, 999);
            return endDate < today;
          }).length, 
          color: '#6B7280' 
        },
        { 
          name: 'À venir', 
          value: allContracts.filter(c => {
            const startDate = new Date(c.startDate);
            startDate.setHours(0, 0, 0, 0);
            return startDate > today;
          }).length, 
          color: '#3B82F6' 
        }
      ];

      setChartData({
        weeklyHours: weeklyData,
        monthlyRevenue: monthlyData,
        contractsDistribution: contractsDistribution.filter(item => item.value > 0)
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données graphiques:', error);
    }
  };

  const loadTopEmployees = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      const monthEntries = await TimeTrackingService.getTimeEntries({
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });

      // Grouper par employé
      const employeeStats = {};
      for (const entry of monthEntries) {
        if (!employeeStats[entry.employeeId]) {
          employeeStats[entry.employeeId] = {
            totalHours: 0,
            revenue: 0,
            validatedHours: 0
          };
        }
        employeeStats[entry.employeeId].totalHours += entry.totalHours || 0;
        employeeStats[entry.employeeId].revenue += (entry.totalHours || 0) * (entry.billingRate || 0);
        if (entry.status === 'validated' || entry.status === 'invoiced') {
          employeeStats[entry.employeeId].validatedHours += entry.totalHours || 0;
        }
      }

      // Récupérer les détails des employés et créer le top
      const employees = await DatabaseService.getEmployees();
      const topEmployeesList = Object.entries(employeeStats)
        .map(([employeeId, stats]) => {
          const employee = employees.find(e => e.id == employeeId);
          return {
            id: employeeId,
            name: employee ? `${employee.firstName} ${employee.lastName}` : 'Inconnu',
            ...stats,
            productivity: stats.totalHours > 0 ? (stats.validatedHours / stats.totalHours) * 100 : 0
          };
        })
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 5);

      setTopEmployees(topEmployeesList);
    } catch (error) {
      console.error('Erreur lors du chargement du top employés:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const recentEntries = await TimeTrackingService.getTimeEntries({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      
      const activity = recentEntries
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 8)
        .map(entry => ({
          id: entry.id,
          type: entry.status === 'validated' ? 'validation' : entry.status === 'invoiced' ? 'facturation' : 'pointage',
          description: entry.status === 'validated' 
            ? `Pointage validé - ${entry.totalHours}h`
            : entry.status === 'invoiced'
            ? `Pointage facturé - ${entry.totalHours}h`
            : `Nouveau pointage - ${entry.totalHours}h`,
          date: entry.updatedAt || entry.createdAt,
          status: entry.status,
          hours: entry.totalHours
        }));
      
      setRecentActivity(activity);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité récente:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Fonctions utilitaires
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (endDateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateString);
    endDate.setHours(0, 0, 0, 0);
    const differenceInTime = endDate.getTime() - today.getTime();
    return Math.ceil(differenceInTime / (1000 * 3600 * 24));
  };

  const getActivityIcon = (type, status) => {
    if (type === 'validation') return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    if (type === 'facturation') return <CurrencyEuroIcon className="h-4 w-4 text-blue-500" />;
    if (status === 'draft') return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
    return <ClockIcon className="h-4 w-4 text-blue-500" />;
  };

  const getProductivityColor = (productivity) => {
    if (productivity >= 90) return 'text-green-600';
    if (productivity >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Chargement ultra-moderne
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chargement du Dashboard
            </h2>
            <p className="text-gray-600">Analyse des données en temps réel...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6">
        {/* En-tête ultra-moderne */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-blue-600">Dashboard</span>{' '}
              <span className="text-purple-600">Analytics</span>
            </h1>
            <p className="text-lg text-gray-600 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-purple-500" />
              Vue d'ensemble intelligente de votre activité
            </p>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20">
              <div className="text-sm text-gray-500">Dernière sync</div>
              <div className="font-semibold text-gray-800">{lastUpdate.toLocaleTimeString('fr-FR')}</div>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <RocketLaunchIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
              </div>
            </button>
          </div>
        </div>

        {/* KPI Cards ultra-modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Employés Actifs */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{stats.activeEmployees}</div>
                  <div className="text-blue-200 text-sm">/ {stats.totalEmployees} total</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Employés Actifs</h3>
              <div className="flex items-center justify-between">
                <span className="text-blue-200 text-sm">
                  {timeTrackingStats.activeEmployeesWorking} en mission
                </span>
                <div className="flex items-center text-green-300">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">+12%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenus */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BanknotesIcon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {formatCurrency(timeTrackingStats.totalRevenue)}
                  </div>
                  <div className="text-emerald-200 text-sm">ce mois-ci</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Chiffre d'Affaires</h3>
              <div className="flex items-center justify-between">
                <span className="text-emerald-200 text-sm">
                  {timeTrackingStats.totalHoursThisMonth.toFixed(0)}h facturées
                </span>
                <div className="flex items-center text-green-300">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">+8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Productivité */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BoltIcon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{timeTrackingStats.productivity}%</div>
                  <div className="text-purple-200 text-sm">productivité</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Performance</h3>
              <div className="flex items-center justify-between">
                <span className="text-purple-200 text-sm">
                  {timeTrackingStats.averageHoursPerDay.toFixed(1)}h/jour moy.
                </span>
                <div className="flex items-center text-green-300">
                  <FireIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">Excellent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Validations */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ExclamationTriangleIcon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{timeTrackingStats.pendingValidations}</div>
                  <div className="text-amber-200 text-sm">en attente</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Validations</h3>
              <div className="flex items-center justify-between">
                <span className="text-amber-200 text-sm">Action requise</span>
                {timeTrackingStats.pendingValidations > 0 && (
                  <Link to="/pointage" className="bg-white/20 px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition-colors">
                    Valider
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques et analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Graphique des heures hebdomadaires */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Heures par jour</h3>
                <p className="text-gray-600">Performance de la semaine</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.weeklyHours}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Area type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique des revenus mensuels */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Revenus mensuels</h3>
                <p className="text-gray-600">Évolution sur 6 mois</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
                <ArrowUpIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                  }}
                  formatter={(value) => [formatCurrency(value), 'Revenus']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={4} 
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution des contrats (Pie Chart) */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Répartition des contrats</h3>
                <p className="text-gray-600">Statuts actuels</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            {chartData.contractsDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.contractsDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.contractsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune donnée disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Employés */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Top Performers</h3>
                <p className="text-gray-600">Meilleurs employés du mois</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            {topEmployees.length > 0 ? (
              <div className="space-y-4">
                {topEmployees.map((employee, index) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                        'bg-gradient-to-r from-blue-400 to-purple-500'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{employee.name}</div>
                        <div className="text-sm text-gray-600">{employee.totalHours.toFixed(1)}h • {formatCurrency(employee.revenue)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getProductivityColor(employee.productivity)}`}>
                        {employee.productivity.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">productivité</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                <div className="text-center">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune donnée ce mois-ci</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section inférieure avec contrats et activité */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Contrats se terminant bientôt - 2/3 */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationCircleIcon className="w-6 h-6 mr-3" />
                  <div>
                    <h3 className="text-xl font-semibold">Contrats à échéance</h3>
                    <p className="text-red-100">Attention requise</p>
                  </div>
                </div>
                <Link to="/contracts" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
                  Voir tous
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {endingSoonContracts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Contrat</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Échéance</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endingSoonContracts.slice(0, 5).map((contract) => {
                        const daysRemaining = getDaysRemaining(contract.endDate);
                        let urgencyClass = 'bg-green-100 text-green-800';
                        let urgencyIcon = '🟢';
                        
                        if (daysRemaining < 7) {
                          urgencyClass = 'bg-red-100 text-red-800';
                          urgencyIcon = '🔴';
                        } else if (daysRemaining < 14) {
                          urgencyClass = 'bg-yellow-100 text-yellow-800';
                          urgencyIcon = '🟡';
                        }
                        
                        return (
                          <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900">
                                {contract.title || `CONT-${contract.id}`}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-700">
                              {formatDate(contract.endDate)}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${urgencyClass}`}>
                                <span className="mr-1">{urgencyIcon}</span>
                                {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <Link 
                                  to={`/contracts/${contract.id}`}
                                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <EyeIcon className="h-3 w-3 mr-1" />
                                  Voir
                                </Link>
                                <Link
                                  to={`/contracts/${contract.id}`} 
                                  className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                >
                                  <PencilIcon className="h-3 w-3 mr-1" />
                                  Modifier
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Tous les contrats sont sécurisés</h4>
                  <p className="text-gray-600">Aucun contrat ne se termine dans les 30 prochains jours</p>
                </div>
              )}
            </div>
          </div>

          {/* Activité récente et actions rapides - 1/3 */}
          <div className="space-y-6">
            {/* Activité récente */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
                <div className="flex items-center">
                  <LightBulbIcon className="w-6 h-6 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">Activité récente</h3>
                    <p className="text-indigo-100">Dernières actions</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type, activity.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">{formatDateTime(activity.date)}</p>
                            <span className="text-xs font-medium text-blue-600">{activity.hours}h</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Aucune activité récente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions rapides améliorées */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                <div className="flex items-center">
                  <RocketLaunchIcon className="w-6 h-6 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">Actions rapides</h3>
                    <p className="text-green-100">Créer rapidement</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-3">
                <Link 
                  to="/contracts/new" 
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-700">Nouveau contrat</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  to="/employees/new" 
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium text-green-700">Nouvel employé</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  to="/clients/new" 
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="font-medium text-purple-700">Nouveau client</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;