import { useState, useCallback, useEffect, useMemo } from 'react';
import { fetchAndCacheMonth } from '../api/storage';

export function useQuickscrum() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(null);

    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loadedMonths, setLoadedMonths] = useState(new Set());

    const [searchQuery, setSearchQuery] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterType, setFilterType] = useState('');

    const loadMonthData = useCallback(async (monthStr, forceRefresh = false) => {
        setLoading(true);
        setError(null);
        setProgress({ total: 0, processed: 0, month: monthStr });

        try {
            const monthItems = await fetchAndCacheMonth(monthStr, (stats) => {
                setProgress(stats);
            }, forceRefresh);

            setItems(prev => {
                const newItemsMap = new Map();
                if (!forceRefresh) {
                    prev.forEach(item => newItemsMap.set(item.id, item));
                }
                monthItems.forEach(item => newItemsMap.set(item.id, item));
                return Array.from(newItemsMap.values()).sort((a, b) => b.assignedDate - a.assignedDate);
            });

            setLoadedMonths(prev => new Set(prev).add(monthStr));
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to fetch items. Check API limits or authentication.');
        } finally {
            setLoading(false);
            setProgress(null);
        }
    }, []);

    useEffect(() => {
        if (!loadedMonths.has(currentMonth)) {
            loadMonthData(currentMonth);
        }
    }, [currentMonth, loadedMonths, loadMonthData]);

    const loadPreviousMonth = useCallback(() => {
        if (loading) return;
        const [yearStr, monthStr] = currentMonth.split('-');
        let year = parseInt(yearStr);
        let month = parseInt(monthStr);
        month -= 1;
        if (month === 0) {
            month = 12;
            year -= 1;
        }
        const prevMonth = `${year}-${String(month).padStart(2, '0')}`;
        setCurrentMonth(prevMonth);
    }, [currentMonth, loading]);

    const refresh = useCallback(() => {
        const d = new Date();
        const thisMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        loadMonthData(thisMonth, true);
    }, [loadMonthData]);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setFilterProject('');
        setFilterType('');
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (filterProject && item.project !== filterProject) return false;
            if (filterType && item.type !== filterType) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesTitle = item.title?.toLowerCase().includes(q);
                const matchesId = item.id?.toLowerCase().includes(q);
                const matchesProject = item.project?.toLowerCase().includes(q);
                return matchesTitle || matchesId || matchesProject;
            }
            return true;
        });
    }, [items, searchQuery, filterProject, filterType]);

    const availableProjects = useMemo(() => {
        const projects = new Set();
        items.forEach(item => {
            if (item.project) projects.add(item.project);
        });
        return Array.from(projects).sort();
    }, [items]);

    return {
        items: filteredItems,
        loading,
        error,
        progress,
        refresh,
        loadPreviousMonth,
        searchQuery, setSearchQuery,
        filterProject, setFilterProject,
        filterType, setFilterType,
        availableProjects,
        clearFilters
    };
}
