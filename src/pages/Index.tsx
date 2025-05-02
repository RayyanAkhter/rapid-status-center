
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { 
  ArrowUp, 
  ArrowDown, 
  BellDot, 
  CircleCheck,
  CircleAlert,
  CircleX,
  Info,
  BellRing,
  ChartBar,
  ChartLine
} from "lucide-react";

// Define types for our data
interface MetricData {
  time: string;
  value: number;
}

interface Alert {
  id: string;
  timestamp: Date;
  message: string;
  type: "warning" | "critical" | "info";
  metric: string;
  value: number;
  threshold: number;
  acknowledged: boolean;
}

interface SystemStatus {
  name: string;
  status: "healthy" | "warning" | "critical";
  currentValue: number;
  thresholds: {
    warning: number;
    critical: number;
  };
  unit: string;
  change: number;
  data: MetricData[];
}

const LiveDashboard = () => {
  // State for various components
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [refreshRate, setRefreshRate] = useState(5);
  const [alertThresholds, setAlertThresholds] = useState({
    cpuWarning: 70,
    cpuCritical: 90,
    memoryWarning: 80,
    memoryCritical: 95,
    apiLatencyWarning: 200,
    apiLatencyCritical: 500,
    trafficWarning: 1000,
    trafficCritical: 2000,
    temperatureWarning: 70,
    temperatureCritical: 85,
  });
  const [systemHealth, setSystemHealth] = useState<Record<string, number>>({
    healthy: 0,
    warning: 0,
    critical: 0,
  });
  const [showAlertDetails, setShowAlertDetails] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Refs
  const notificationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initial metrics data setup
  useEffect(() => {
    // Generate initial system statuses
    const initialSystemStatuses: SystemStatus[] = [
      {
        name: "CPU Usage",
        status: "healthy",
        currentValue: 45,
        thresholds: {
          warning: alertThresholds.cpuWarning,
          critical: alertThresholds.cpuCritical,
        },
        unit: "%",
        change: 5,
        data: generateHistoricalData(45, 20),
      },
      {
        name: "Memory Usage",
        status: "warning",
        currentValue: 82,
        thresholds: {
          warning: alertThresholds.memoryWarning,
          critical: alertThresholds.memoryCritical,
        },
        unit: "%",
        change: 12,
        data: generateHistoricalData(82, 10),
      },
      {
        name: "API Latency",
        status: "healthy",
        currentValue: 124,
        thresholds: {
          warning: alertThresholds.apiLatencyWarning,
          critical: alertThresholds.apiLatencyCritical,
        },
        unit: "ms",
        change: -8,
        data: generateHistoricalData(124, 30),
      },
      {
        name: "Traffic",
        status: "healthy",
        currentValue: 842,
        thresholds: {
          warning: alertThresholds.trafficWarning,
          critical: alertThresholds.trafficCritical,
        },
        unit: "req/min",
        change: 56,
        data: generateHistoricalData(842, 100),
      },
      {
        name: "Temperature",
        status: "critical",
        currentValue: 88,
        thresholds: {
          warning: alertThresholds.temperatureWarning,
          critical: alertThresholds.temperatureCritical,
        },
        unit: "°F",
        change: 15,
        data: generateHistoricalData(88, 5),
      },
    ];

    setSystemStatuses(initialSystemStatuses);

    // Generate initial alerts
    const initialAlerts: Alert[] = [
      {
        id: "alert-1",
        timestamp: new Date(Date.now() - 2 * 60000),
        message: "Temperature exceeding critical threshold",
        type: "critical",
        metric: "Temperature",
        value: 88,
        threshold: alertThresholds.temperatureCritical,
        acknowledged: false,
      },
      {
        id: "alert-2",
        timestamp: new Date(Date.now() - 15 * 60000),
        message: "Memory usage exceeding warning threshold",
        type: "warning",
        metric: "Memory Usage",
        value: 82,
        threshold: alertThresholds.memoryWarning,
        acknowledged: false,
      },
      {
        id: "alert-3",
        timestamp: new Date(Date.now() - 45 * 60000),
        message: "Traffic spike detected",
        type: "info",
        metric: "Traffic",
        value: 950,
        threshold: 900,
        acknowledged: true,
      },
    ];

    setAlerts(initialAlerts);

    // Setup periodic data refresh
    const refreshInterval = setInterval(() => {
      updateSystemStatuses();
    }, refreshRate * 1000);

    return () => clearInterval(refreshInterval);
  }, [alertThresholds, refreshRate]);

  // Update system health counts whenever statuses change
  useEffect(() => {
    const counts = {
      healthy: 0,
      warning: 0,
      critical: 0,
    };

    systemStatuses.forEach((system) => {
      counts[system.status] += 1;
    });

    setSystemHealth(counts);
  }, [systemStatuses]);

  // Helper functions
  const generateHistoricalData = (
    currentValue: number,
    variance: number
  ): MetricData[] => {
    const data: MetricData[] = [];
    const now = new Date();

    for (let i = 20; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 60 * 1000);
      const timeString = pastTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Generate a somewhat realistic pattern with some randomness
      const randomVariance = (Math.random() - 0.5) * variance;
      const adjustedValue = Math.max(
        0,
        currentValue + randomVariance - i * (variance / 40)
      );

      data.push({
        time: timeString,
        value: Math.round(adjustedValue * 10) / 10,
      });
    }

    return data;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "critical":
        return "bg-rose-600";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLightColor = (status: string): string => {
    switch (status) {
      case "healthy":
        return "bg-emerald-100 text-emerald-800";
      case "warning":
        return "bg-amber-100 text-amber-800";
      case "critical":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAlertBgColor = (type: string): string => {
    switch (type) {
      case "critical":
        return "bg-rose-50";
      case "warning":
        return "bg-amber-50";
      case "info":
        return "bg-blue-50";
      default:
        return "bg-gray-50";
    }
  };

  const getAlertIconColor = (type: string): string => {
    switch (type) {
      case "critical":
        return "text-rose-600";
      case "warning":
        return "text-amber-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <CircleX className={`h-5 w-5 ${getAlertIconColor(type)}`} />;
      case "warning":
        return <CircleAlert className={`h-5 w-5 ${getAlertIconColor(type)}`} />;
      case "info":
        return <Info className={`h-5 w-5 ${getAlertIconColor(type)}`} />;
      default:
        return null;
    }
  };

  const formatTimeDifference = (timestamp: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const showToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);

    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }

    notificationTimeout.current = setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const updateSystemStatuses = () => {
    setSystemStatuses((prevStatuses) => {
      const newStatuses = prevStatuses.map((status) => {
        // Generate a new current value with some randomness
        const variance = status.name === "Traffic" ? 100 : 
                        status.name === "API Latency" ? 50 : 10;
        const randomChange = (Math.random() - 0.5) * variance;
        const newValue = Math.max(0, status.currentValue + randomChange);
        
        // Determine the new status based on thresholds
        let newStatus: "healthy" | "warning" | "critical" = "healthy";
        if (newValue >= status.thresholds.critical) {
          newStatus = "critical";
        } else if (newValue >= status.thresholds.warning) {
          newStatus = "warning";
        }
        
        // Calculate the change since last update
        const change = newValue - status.currentValue;
        
        // Generate new historical data
        const newData = [...status.data.slice(1), {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: Math.round(newValue * 10) / 10,
        }];
        
        // Check if we need to create a new alert
        if (
          (newStatus === "critical" && status.status !== "critical") ||
          (newStatus === "warning" && status.status === "healthy")
        ) {
          const alertType = newStatus === "critical" ? "critical" : "warning";
          const threshold = newStatus === "critical" 
            ? status.thresholds.critical 
            : status.thresholds.warning;
          
          const newAlert: Alert = {
            id: `alert-${Date.now()}`,
            timestamp: new Date(),
            message: `${status.name} ${newStatus === "critical" ? "exceeding critical threshold" : "exceeding warning threshold"}`,
            type: alertType,
            metric: status.name,
            value: Math.round(newValue * 10) / 10,
            threshold,
            acknowledged: false,
          };
          
          // Add the new alert to state
          setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
          
          // Show notification
          showToast(`New ${alertType} alert: ${newAlert.message}`);
        }
        
        // Return the updated status
        return {
          ...status,
          currentValue: Math.round(newValue * 10) / 10,
          status: newStatus,
          change: Math.round(change * 10) / 10,
          data: newData,
        };
      });
      
      return newStatuses;
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    showToast("Alert acknowledged");
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
    showToast("Alert dismissed");
    setShowAlertDetails(null);
  };

  // Filter system statuses and alerts based on search query
  const filteredSystemStatuses = systemStatuses.filter((status) =>
    status.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.metric.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Theme toggle handler
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Save settings handler
  const saveSettings = () => {
    setShowSettingsModal(false);
    showToast("Settings saved successfully");
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900 text-white" : "bg-gray-50"}`}>
      {/* Navigation Bar */}
      <header className={`${darkMode ? "bg-gray-800" : "bg-white"} border-b ${darkMode ? "border-gray-700" : "border-gray-200"} shadow-sm sticky top-0 z-10`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Branding */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <motion.div
                  className={`flex items-center ${darkMode ? "text-blue-400" : "text-blue-600"} font-bold text-xl`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ChartLine className="h-6 w-6 mr-2" />
                  <span>LiveStatus</span>
                </motion.div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center flex-1 px-8 md:ml-6 md:justify-center">
              <div className="w-full max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className={`block w-full pl-10 pr-3 py-2 ${
                      darkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" 
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                    } rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all`}
                    placeholder="Search metrics, alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Side Nav Items */}
            <div className="flex items-center">
              {/* Theme Toggle Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`rounded-full p-2 ${
                  darkMode ? "bg-gray-700 text-yellow-200" : "bg-gray-100 text-gray-600"
                } mr-2`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </motion.button>

              {/* Notifications */}
              <motion.div className="relative">
                <button
                  className={`rounded-full p-2 ${
                    darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"
                  } mr-2 relative`}
                  aria-label="View notifications"
                >
                  <BellDot className="h-5 w-5" />
                  {alerts.some((alert) => !alert.acknowledged) && (
                    <motion.span
                      className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-gray-800"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    />
                  )}
                </button>
              </motion.div>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className={`rounded-full p-2 ${
                  darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"
                }`}
                aria-label="Settings"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* User Profile */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full"
                      src="https://randomuser.me/api/portraits/women/65.jpg"
                      alt="User avatar"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          className={`${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          } ${
            sidebarOpen ? "w-64" : "w-20"
          } border-r ${
            darkMode ? "border-gray-700" : "border-gray-200"
          } min-h-screen fixed top-16 transition-all duration-300 ease-in-out`}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="p-4">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`mb-6 p-2 ${
                darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"
              } rounded-md hover:bg-blue-500 hover:text-white transition-colors w-full flex items-center justify-center`}
            >
              <svg
                className={`h-5 w-5 transition-transform ${
                  sidebarOpen ? "" : "transform rotate-180"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
              {sidebarOpen && <span className="ml-2">Collapse</span>}
            </button>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {[
                {
                  name: "Overview",
                  id: "overview",
                  icon: (
                    <ChartBar className="h-5 w-5" />
                  ),
                },
                {
                  name: "Metrics",
                  id: "metrics",
                  icon: (
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ),
                },
                {
                  name: "Alerts",
                  id: "alerts",
                  icon: (
                    <BellRing className="h-5 w-5" />
                  ),
                },
              ].map((item) => (
                <motion.a
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`${
                    activeTab === item.id
                      ? darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-blue-50 text-blue-700"
                      : darkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } group flex items-center px-2 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors`}
                  aria-current={activeTab === item.id ? "page" : undefined}
                >
                  <div
                    className={`${
                      activeTab === item.id
                        ? "text-blue-500"
                        : darkMode
                        ? "text-gray-400 group-hover:text-gray-300"
                        : "text-gray-500 group-hover:text-gray-900"
                    } mr-3 flex-shrink-0`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </div>
                  {sidebarOpen && <span>{item.name}</span>}
                  
                  {/* Show alert count badge */}
                  {item.id === "alerts" && !item.acknowledged && alerts.filter(a => !a.acknowledged).length > 0 && (
                    <motion.span 
                      className={`${
                        darkMode ? "bg-rose-700 text-white" : "bg-rose-500 text-white"
                      } ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      {alerts.filter(a => !a.acknowledged).length}
                    </motion.span>
                  )}
                </motion.a>
              ))}
            </nav>

            {/* System Health Stats */}
            {sidebarOpen && (
              <div className="mt-8">
                <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} mb-3`}>
                  System Health
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-emerald-500 flex items-center">
                      <CircleCheck className="h-4 w-4 mr-1" />
                      Healthy
                    </span>
                    <span className="font-medium">{systemHealth.healthy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-500 flex items-center">
                      <CircleAlert className="h-4 w-4 mr-1" />
                      Warning
                    </span>
                    <span className="font-medium">{systemHealth.warning}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-rose-500 flex items-center">
                      <CircleX className="h-4 w-4 mr-1" />
                      Critical
                    </span>
                    <span className="font-medium">{systemHealth.critical}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <div className={`absolute bottom-0 w-full p-4 border-t ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://randomuser.me/api/portraits/women/65.jpg"
                    alt="User avatar"
                  />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Emma Johnson
                  </p>
                  <p className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    Admin
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.aside>

        {/* Main Content Area */}
        <main
          className={`flex-1 ${
            darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
          } transition-all duration-300 p-6 ${
            sidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Dashboard Title */}
              <div className="mb-8">
                <h1 className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                  System Status Dashboard
                </h1>
                <p className={`${
                  darkMode ? "text-gray-400" : "text-gray-600"
                } mt-1`}>
                  Real-time monitoring and alerting
                </p>
              </div>

              {/* System Status Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
                {filteredSystemStatuses.map((status) => (
                  <motion.div
                    key={status.name}
                    className={`${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } overflow-hidden shadow-md rounded-lg`}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}>
                          {status.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusLightColor(
                            status.status
                          )}`}
                        >
                          {status.status.charAt(0).toUpperCase() +
                            status.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline">
                        <p
                          className={`text-2xl font-semibold ${
                            darkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          {status.currentValue}
                        </p>
                        <p className="ml-2 text-sm text-gray-500">{status.unit}</p>
                        <div
                          className={`ml-auto flex items-center ${
                            status.change > 0 ? "text-rose-500" : "text-emerald-500"
                          }`}
                        >
                          {status.change > 0 ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium ml-1">
                            {Math.abs(status.change)}
                          </span>
                        </div>
                      </div>

                      {/* Mini Sparkline Chart */}
                      <div className="h-16 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={status.data}>
                            <defs>
                              <linearGradient
                                id={`gradient-${status.name.replace(/\s+/g, "-")}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={
                                    status.status === "critical"
                                      ? "#f43f5e"
                                      : status.status === "warning"
                                      ? "#f59e0b"
                                      : "#10b981"
                                  }
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={
                                    status.status === "critical"
                                      ? "#f43f5e"
                                      : status.status === "warning"
                                      ? "#f59e0b"
                                      : "#10b981"
                                  }
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={
                                status.status === "critical"
                                  ? "#f43f5e"
                                  : status.status === "warning"
                                  ? "#f59e0b"
                                  : "#10b981"
                              }
                              fillOpacity={1}
                              fill={`url(#gradient-${status.name.replace(/\s+/g, "-")})`}
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Thresholds */}
                      <div className="mt-4 flex justify-between text-xs">
                        <div className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <span>Warning: {status.thresholds.warning}{status.unit}</span>
                        </div>
                        <div className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <span>Critical: {status.thresholds.critical}{status.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator Bar */}
                    <div
                      className={`h-1 w-full ${getStatusColor(status.status)}`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Main Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* CPU Usage Chart */}
                <motion.div
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } p-6 rounded-lg shadow-md`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-lg font-medium ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}>
                      CPU Usage
                    </h2>
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        systemStatuses.find((s) => s.name === "CPU Usage")?.status === "critical"
                          ? "bg-rose-100 text-rose-800"
                          : systemStatuses.find((s) => s.name === "CPU Usage")?.status === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {systemStatuses.find((s) => s.name === "CPU Usage")?.status.charAt(0).toUpperCase() +
                        systemStatuses.find((s) => s.name === "CPU Usage")?.status.slice(1) || "Healthy"}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={systemStatuses.find((s) => s.name === "CPU Usage")?.data || []}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={darkMode ? "#374151" : "#f0f0f0"}
                        />
                        <XAxis
                          dataKey="time"
                          stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                        />
                        <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                            borderColor: darkMode ? "#4B5563" : "#E5E7EB",
                            color: darkMode ? "#F9FAFB" : "#111827",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={true}
                          activeDot={{ r: 6 }}
                        />
                        {/* Warning Threshold Line */}
                        <Line
                          type="monotone"
                          dataKey={() => alertThresholds.cpuWarning}
                          stroke="#F59E0B"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        {/* Critical Threshold Line */}
                        <Line
                          type="monotone"
                          dataKey={() => alertThresholds.cpuCritical}
                          stroke="#EF4444"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Memory Usage Chart */}
                <motion.div
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } p-6 rounded-lg shadow-md`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-lg font-medium ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}>
                      Memory Usage
                    </h2>
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        systemStatuses.find((s) => s.name === "Memory Usage")?.status === "critical"
                          ? "bg-rose-100 text-rose-800"
                          : systemStatuses.find((s) => s.name === "Memory Usage")?.status === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {systemStatuses.find((s) => s.name === "Memory Usage")?.status.charAt(0).toUpperCase() +
                        systemStatuses.find((s) => s.name === "Memory Usage")?.status.slice(1) || "Healthy"}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={systemStatuses.find((s) => s.name === "Memory Usage")?.data || []}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={darkMode ? "#374151" : "#f0f0f0"}
                        />
                        <XAxis
                          dataKey="time"
                          stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                        />
                        <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                            borderColor: darkMode ? "#4B5563" : "#E5E7EB",
                            color: darkMode ? "#F9FAFB" : "#111827",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill={
                            systemStatuses.find((s) => s.name === "Memory Usage")?.status === "critical"
                              ? "#EF4444"
                              : systemStatuses.find((s) => s.name === "Memory Usage")?.status === "warning"
                              ? "#F59E0B"
                              : "#10B981"
                          }
                          radius={[4, 4, 0, 0]}
                        />
                        {/* Warning Threshold Line */}
                        <Line
                          type="monotone"
                          dataKey={() => alertThresholds.memoryWarning}
                          stroke="#F59E0B"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        {/* Critical Threshold Line */}
                        <Line
                          type="monotone"
                          dataKey={() => alertThresholds.memoryCritical}
                          stroke="#EF4444"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* Alerts Section */}
              <motion.div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-lg shadow-md overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className={`text-lg font-medium ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Recent Alerts
                  </h2>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {filteredAlerts.length} Total
                  </span>
                </div>

                {filteredAlerts.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAlerts.slice(0, 5).map((alert) => (
                      <motion.div
                        key={alert.id}
                        className={`p-4 ${getAlertBgColor(
                          alert.type
                        )} dark:bg-opacity-10 ${
                          alert.acknowledged ? "opacity-70" : "opacity-100"
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        onClick={() => setShowAlertDetails(alert.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm font-medium ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {alert.message}
                              </p>
                              <span
                                className={`text-xs ${
                                  darkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {formatTimeDifference(alert.timestamp)}
                              </span>
                            </div>
                            <div className="mt-1 flex justify-between">
                              <p
                                className={`text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                {alert.metric}: {alert.value} (Threshold: {alert.threshold})
                              </p>
                              {!alert.acknowledged && (
                                <div className="flex space-x-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      acknowledgeAlert(alert.id);
                                    }}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    Acknowledge
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissAlert(alert.id);
                                    }}
                                    className="text-xs font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                                  >
                                    Dismiss
                                  </motion.button>
                                </div>
                              )}
                              {alert.acknowledged && (
                                <span
                                  className={`text-xs ${
                                    darkMode ? "text-gray-500" : "text-gray-500"
                                  }`}
                                >
                                  Acknowledged
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`p-8 text-center ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <p>No alerts to display.</p>
                  </div>
                )}

                {filteredAlerts.length > 5 && (
                  <div
                    className={`p-4 text-center border-t ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <a
                      href="#"
                      onClick={() => setActiveTab("alerts")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View all {filteredAlerts.length} alerts →
                    </a>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "metrics" && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                Detailed Metrics
              </h1>
              
              <p className={`${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                View and analyze all system metrics with detailed charts and trends.
              </p>
              
              {systemStatuses.map((status) => (
                <motion.div
                  key={status.name}
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } rounded-lg shadow-md overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className={`text-xl font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}>
                        {status.name}
                      </h2>
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${
                            getStatusLightColor(status.status)
                          }`}
                        >
                          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                        </span>
                        <div
                          className={`flex items-center ${
                            status.change > 0 ? "text-rose-500" : "text-emerald-500"
                          }`}
                        >
                          {status.change > 0 ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium ml-1">
                            {Math.abs(status.change)}{status.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline mb-6">
                      <p
                        className={`text-3xl font-bold ${
                          darkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {status.currentValue}
                      </p>
                      <p className={`ml-2 text-lg ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {status.unit}
                      </p>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={status.data}>
                          <defs>
                            <linearGradient
                              id={`detailGradient-${status.name.replace(/\s+/g, "-")}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={
                                  status.status === "critical"
                                    ? "#f43f5e"
                                    : status.status === "warning"
                                    ? "#f59e0b"
                                    : "#10b981"
                                }
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={
                                  status.status === "critical"
                                    ? "#f43f5e"
                                    : status.status === "warning"
                                    ? "#f59e0b"
                                    : "#10b981"
                                }
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={darkMode ? "#374151" : "#f0f0f0"}
                          />
                          <XAxis
                            dataKey="time"
                            stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                          />
                          <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                              borderColor: darkMode ? "#4B5563" : "#E5E7EB",
                              color: darkMode ? "#F9FAFB" : "#111827",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={
                              status.status === "critical"
                                ? "#f43f5e"
                                : status.status === "warning"
                                ? "#f59e0b"
                                : "#10b981"
                            }
                            fillOpacity={1}
                            fill={`url(#detailGradient-${status.name.replace(/\s+/g, "-")})`}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                          {/* Warning Threshold Line */}
                          <Line
                            type="monotone"
                            dataKey={() => status.thresholds.warning}
                            stroke="#F59E0B"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                          {/* Critical Threshold Line */}
                          <Line
                            type="monotone"
                            dataKey={() => status.thresholds.critical}
                            stroke="#EF4444"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className={`p-4 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}>
                        <p className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        } mb-1`}>
                          Current
                        </p>
                        <p className={`text-xl font-bold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {status.currentValue}{status.unit}
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}>
                        <p className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        } mb-1`}>
                          Warning Threshold
                        </p>
                        <p className={`text-xl font-bold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {status.thresholds.warning}{status.unit}
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}>
                        <p className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        } mb-1`}>
                          Critical Threshold
                        </p>
                        <p className={`text-xl font-bold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {status.thresholds.critical}{status.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Alerts
                  </h1>
                  <p className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } mt-1`}>
                    Manage and respond to all system alerts
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    className={`${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    } px-4 py-2 rounded-md text-sm flex items-center transition-colors`}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Filter
                  </button>
                  <button
                    className={`${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    } px-4 py-2 rounded-md text-sm flex items-center transition-colors`}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    History
                  </button>
                </div>
              </div>

              {/* Alert List */}
              <div className={`rounded-lg shadow-md overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}>
                {filteredAlerts.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        className={`p-5 ${getAlertBgColor(
                          alert.type
                        )} dark:bg-opacity-10 ${
                          alert.acknowledged ? "opacity-75" : "opacity-100"
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        onClick={() => setShowAlertDetails(alert.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-base font-medium ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {alert.message}
                              </p>
                              <p
                                className={`text-sm ${
                                  darkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {alert.timestamp.toLocaleString()}
                              </p>
                            </div>
                            <div className="mt-1">
                              <p
                                className={`text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                {alert.metric}: {alert.value} (Threshold: {alert.threshold})
                              </p>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                              <div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                                    alert.type === "critical"
                                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                                      : alert.type === "warning"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  }`}
                                >
                                  {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                                </span>
                                {alert.acknowledged && (
                                  <span
                                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`}
                                  >
                                    Acknowledged
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-3">
                                {!alert.acknowledged && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      acknowledgeAlert(alert.id);
                                    }}
                                    className={`${
                                      darkMode
                                        ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                                        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                                    } px-3 py-1.5 text-sm font-medium text-white rounded-md inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                  >
                                    <CircleCheck className="h-4 w-4 mr-1" />
                                    Acknowledge
                                  </motion.button>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissAlert(alert.id);
                                  }}
                                  className={`${
                                    darkMode
                                      ? "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
                                      : "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-300"
                                  } px-3 py-1.5 text-sm font-medium rounded-md inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                >
                                  <svg
                                    className="h-4 w-4 mr-1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Dismiss
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`p-8 text-center ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <p>No alerts to display.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer
        className={`${
          darkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"
        } py-6 border-t ${
          darkMode ? "border-gray-700" : "border-gray-200"
        } ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div
                className={`flex items-center ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                } font-bold text-lg mr-2`}
              >
                <ChartLine className="h-5 w-5 mr-1" />
                <span>LiveStatus</span>
              </div>
              <span className="text-sm">© 2023 All rights reserved</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a
                href="#"
                className={`${
                  darkMode ? "hover:text-gray-300" : "hover:text-gray-900"
                } transition-colors`}
              >
                Documentation
              </a>
              <a
                href="#"
                className={`${
                  darkMode ? "hover:text-gray-300" : "hover:text-gray-900"
                } transition-colors`}
              >
                Support
              </a>
              <a
                href="#"
                className={`${
                  darkMode ? "hover:text-gray-300" : "hover:text-gray-900"
                } transition-colors`}
              >
                API
              </a>
              <a
                href="#"
                className={`${
                  darkMode ? "hover:text-gray-300" : "hover:text-gray-900"
                } transition-colors`}
              >
                Status
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-xl w-full max-w-md p-6`}
            >
              <div className="flex justify-between items-center mb-5">
                <h3
                  className={`text-lg font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Dashboard Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`${
                    darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Refresh Rate */}
                <div>
                  <label
                    htmlFor="refreshRate"
                    className={`block text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    } mb-2`}
                  >
                    Data Refresh Interval (seconds)
                  </label>
                  <select
                    id="refreshRate"
                    value={refreshRate}
                    onChange={(e) => setRefreshRate(Number(e.target.value))}
                    className={`block w-full rounded-md border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value={1}>1</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                  </select>
                </div>

                {/* Alert Thresholds */}
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    } mb-3`}
                  >
                    Alert Thresholds
                  </h4>
                  <div className="space-y-4">
                    {/* CPU */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="cpuWarning"
                          className={`block text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          CPU Warning (%)
                        </label>
                        <input
                          type="number"
                          id="cpuWarning"
                          value={alertThresholds.cpuWarning}
                          onChange={(e) =>
                            setAlertThresholds({
                              ...alertThresholds,
                              cpuWarning: Number(e.target.value),
                            })
                          }
                          className={`block w-full rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="cpuCritical"
                          className={`block text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          CPU Critical (%)
                        </label>
                        <input
                          type="number"
                          id="cpuCritical"
                          value={alertThresholds.cpuCritical}
                          onChange={(e) =>
                            setAlertThresholds({
                              ...alertThresholds,
                              cpuCritical: Number(e.target.value),
                            })
                          }
                          className={`block w-full rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        />
                      </div>
                    </div>

                    {/* Memory */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="memoryWarning"
                          className={`block text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          Memory Warning (%)
                        </label>
                        <input
                          type="number"
                          id="memoryWarning"
                          value={alertThresholds.memoryWarning}
                          onChange={(e) =>
                            setAlertThresholds({
                              ...alertThresholds,
                              memoryWarning: Number(e.target.value),
                            })
                          }
                          className={`block w-full rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="memoryCritical"
                          className={`block text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          Memory Critical (%)
                        </label>
                        <input
                          type="number"
                          id="memoryCritical"
                          value={alertThresholds.memoryCritical}
                          onChange={(e) =>
                            setAlertThresholds({
                              ...alertThresholds,
                              memoryCritical: Number(e.target.value),
                            })
                          }
                          className={`block w-full rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        />
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="temperatureWarning"
                          className={`block text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          Temperature Warning (°F)
                        </label>
                        <input
                          type="number"
                          id="temperatureWarning"
                          value={alertThresholds.temperatureWarning}
                          onChange={(e) =>
                            setAlertThresholds({
                              ...alertThresholds,
                              temperatureWarning: Number(e.target.value),
                            })
                          }
                          className={`block w-full rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="temperatureCritical"
                          className={`block text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          Temperature Critical (°F)
                        </label>
                        <input
                          type="number"
                          id="temperatureCritical"
                          value={alertThresholds.temperatureCritical}
                          onChange={(e) =>
                            setAlertThresholds({
                              ...alertThresholds,
                              temperatureCritical: Number(e.target.value),
                            })
                          }
                          className={`block w-full rounded-md border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Settings */}
                <div>
                  <label
                    htmlFor="theme"
                    className={`block text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    } mb-2`}
                  >
                    Theme
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setDarkMode(false)}
                      className={`flex-1 py-2 px-3 rounded-md ${
                        !darkMode
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-gray-100 text-gray-900 border border-gray-300"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setDarkMode(true)}
                      className={`flex-1 py-2 px-3 rounded-md ${
                        darkMode
                          ? "bg-blue-600 text-white border-2 border-blue-400"
                          : "bg-gray-700 text-white border border-gray-600"
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className={`py-2 px-4 rounded-md ${
                      darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={saveSettings}
                    className={`py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors`}
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Details Modal */}
      <AnimatePresence>
        {showAlertDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-xl w-full max-w-md overflow-hidden`}
            >
              {(() => {
                const alert = alerts.find((a) => a.id === showAlertDetails);
                if (!alert) return null;

                return (
                  <>
                    <div
                      className={`p-4 ${getAlertBgColor(
                        alert.type
                      )} dark:bg-opacity-20`}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className="mr-2">{getAlertIcon(alert.type)}</div>
                          <h3
                            className={`text-lg font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {alert.type.charAt(0).toUpperCase() +
                              alert.type.slice(1)}{" "}
                            Alert
                          </h3>
                        </div>
                        <button
                          onClick={() => setShowAlertDetails(null)}
                          className={`${
                            darkMode
                              ? "text-gray-400 hover:text-gray-300"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div>
                        <h4
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } uppercase tracking-wider`}
                        >
                          Message
                        </h4>
                        <p
                          className={`mt-1 text-base ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {alert.message}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4
                            className={`text-sm font-medium ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            } uppercase tracking-wider`}
                          >
                            Metric
                          </h4>
                          <p
                            className={`mt-1 text-base ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {alert.metric}
                          </p>
                        </div>
                        <div>
                          <h4
                            className={`text-sm font-medium ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            } uppercase tracking-wider`}
                          >
                            Time
                          </h4>
                          <p
                            className={`mt-1 text-base ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4
                            className={`text-sm font-medium ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            } uppercase tracking-wider`}
                          >
                            Value
                          </h4>
                          <p
                            className={`mt-1 text-base ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {alert.value}
                          </p>
                        </div>
                        <div>
                          <h4
                            className={`text-sm font-medium ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            } uppercase tracking-wider`}
                          >
                            Threshold
                          </h4>
                          <p
                            className={`mt-1 text-base ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {alert.threshold}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } uppercase tracking-wider`}
                        >
                          Status
                        </h4>
                        <p
                          className={`mt-1 text-base ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {alert.acknowledged ? "Acknowledged" : "Unacknowledged"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`px-6 py-4 flex justify-end space-x-3 border-t ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      {!alert.acknowledged && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            acknowledgeAlert(alert.id);
                            setShowAlertDetails(null);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Acknowledge
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          dismissAlert(alert.id);
                        }}
                        className={`${
                          darkMode
                            ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        } px-4 py-2 rounded-md transition-colors text-sm font-medium`}
                      >
                        Dismiss
                      </motion.button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="fixed top-4 right-4 z-50 max-w-md"
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          >
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-lg overflow-hidden flex p-4 border-l-4 border-blue-500`}
            >
              <div className="flex-shrink-0">
                <BellRing
                  className="h-6 w-6 text-blue-500"
                />
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {notificationMessage}
                </p>
              </div>
              <div className="flex-shrink-0 flex">
                <button
                  onClick={() => setShowNotification(false)}
                  className={`${
                    darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                  } focus:outline-none`}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveDashboard;
