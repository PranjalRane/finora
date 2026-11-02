/**
 * ========================================================
 * FINORA – Financial Analytics & Chart.js Visualizations
 * ========================================================
 */

// Active Chart Instances
let incomeExpenseChart = null;
let categoryDonutChart = null;
let cashflowTrendChart = null;
let overviewMiniDonutChart = null;

/**
 * Refresh and render all Analytics views and metrics
 */
function updateAnalyticsViews(transactions, timeframe = 'all') {
  const filtered = filterTransactionsByTimeframe(transactions, timeframe);

  renderIncomeVsExpenseChart(filtered);
  renderCategoryDonutChart(filtered);
  renderCashFlowTrendChart(filtered);
  renderFinancialMetrics(filtered);
  renderOverviewSpendingBreakdown(transactions);
}

/**
 * Filter transactions by timeframe
 */
function filterTransactionsByTimeframe(transactions, timeframe) {
  if (timeframe === 'all') return transactions;

  const now = new Date();
  
  if (timeframe === 'this-month') {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }

  if (timeframe === 'last-30') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d >= thirtyDaysAgo;
    });
  }

  return transactions;
}

/**
 * 1. Income vs Expense Comparison Chart (Bar Chart)
 */
function renderIncomeVsExpenseChart(transactions) {
  const canvas = document.getElementById('incomeExpenseChart');
  if (!canvas) return;

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  // Aggregate by month (last 6 months or distinct months present in data)
  const monthMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Prepare last 6 months in chronological order
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    monthMap[key] = { income: 0, expense: 0 };
  }

  // Populate data from transactions
  transactions.forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    if (monthMap[key]) {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        monthMap[key].income += amt;
      } else {
        monthMap[key].expense += amt;
      }
    }
  });

  const labels = Object.keys(monthMap);
  const incomeData = labels.map(k => monthMap[k].income);
  const expenseData = labels.map(k => monthMap[k].expense);

  const ctx = canvas.getContext('2d');
  incomeExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#10B981',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#EF4444',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { family: "'Inter', sans-serif", weight: '600', size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#F1F5F9' },
          ticks: {
            callback: value => '$' + (value >= 1000 ? (value / 1000) + 'k' : value),
            font: { family: "'Inter', sans-serif", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Inter', sans-serif", size: 11 } }
        }
      }
    }
  });
}

/**
 * 2. Category-wise Spending Breakdown Chart (Doughnut)
 */
function renderCategoryDonutChart(transactions) {
  const canvas = document.getElementById('categoryDonutChart');
  if (!canvas) return;

  if (categoryDonutChart) {
    categoryDonutChart.destroy();
  }

  // Filter only expenses
  const expenses = transactions.filter(t => t.type === 'expense');
  const catSums = {};

  expenses.forEach(t => {
    const cat = t.category || 'Other Expense';
    catSums[cat] = (catSums[cat] || 0) + parseFloat(t.amount || 0);
  });

  const labels = Object.keys(catSums);
  const data = Object.values(catSums);

  // If no expenses, show empty placeholder
  if (data.length === 0) {
    labels.push('No Expenses');
    data.push(1);
  }

  const bgColors = labels.map(l => (CATEGORY_MAP[l]?.color || '#94A3B8'));

  const ctx = canvas.getContext('2d');
  categoryDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 10,
            font: { family: "'Inter', sans-serif", size: 11.5, weight: '500' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.label === 'No Expenses') return 'No expenses logged';
              return `${context.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

/**
 * 3. Cash Flow / Net Balance Trend Chart (Area Line Chart)
 */
function renderCashFlowTrendChart(transactions) {
  const canvas = document.getElementById('cashflowTrendChart');
  if (!canvas) return;

  if (cashflowTrendChart) {
    cashflowTrendChart.destroy();
  }

  // Sort transactions chronologically
  const chronological = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  const dateLabels = [];
  const cumulativeBalance = [];
  let runningBal = 0;

  chronological.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      runningBal += amt;
    } else {
      runningBal -= amt;
    }
    dateLabels.push(formatDate(t.date));
    cumulativeBalance.push(runningBal);
  });

  if (dateLabels.length === 0) {
    dateLabels.push('Today');
    cumulativeBalance.push(0);
  }

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.28)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  cashflowTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dateLabels,
      datasets: [{
        label: 'Net Balance',
        data: cumulativeBalance,
        borderColor: '#4F46E5',
        backgroundColor: gradient,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#4F46E5',
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `Balance: ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        y: {
          grid: { color: '#F1F5F9' },
          ticks: {
            callback: value => '$' + value,
            font: { family: "'Inter', sans-serif", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Inter', sans-serif", size: 10 } }
        }
      }
    }
  });
}

/**
 * 4. Render Financial Ratios & Metric Cards
 */
function renderFinancialMetrics(transactions) {
  const avgTxnEl = document.getElementById('metricAvgTxn');
  const burnRateEl = document.getElementById('metricBurnRate');
  const dailySpendEl = document.getElementById('metricDailySpend');
  const topExpenseEl = document.getElementById('metricTopExpense');

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  const totalTxnCount = transactions.length;

  // Average Transaction Size
  const totalVolume = transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  const avgTxn = totalTxnCount > 0 ? (totalVolume / totalTxnCount) : 0;
  if (avgTxnEl) avgTxnEl.textContent = formatCurrency(avgTxn);

  // Monthly Burn Rate (Expenses in current month)
  const now = new Date();
  const currentMonthExpenses = expenses.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  if (burnRateEl) burnRateEl.textContent = formatCurrency(currentMonthExpenses);

  // Daily Average Spending
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate() || 1;
  const dailySpend = currentMonthExpenses > 0 ? (currentMonthExpenses / currentDay) : 0;
  if (dailySpendEl) dailySpendEl.textContent = formatCurrency(dailySpend);

  // Highest Single Expense
  let maxExpense = 0;
  expenses.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (amt > maxExpense) maxExpense = amt;
  });
  if (topExpenseEl) topExpenseEl.textContent = formatCurrency(maxExpense);
}

/**
 * 5. Overview Mini Donut & Spending Progress List
 */
function renderOverviewSpendingBreakdown(transactions) {
  const canvas = document.getElementById('miniSpendingDonut');
  const progressList = document.getElementById('categoryProgressList');
  const totalSpentEl = document.getElementById('overviewTotalSpent');

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalSpent = expenses.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

  if (totalSpentEl) totalSpentEl.textContent = formatCurrency(totalSpent);

  // Group by category
  const catSums = {};
  expenses.forEach(t => {
    const cat = t.category || 'Other Expense';
    catSums[cat] = (catSums[cat] || 0) + parseFloat(t.amount || 0);
  });

  // Sort categories by highest spend
  const sortedCategories = Object.keys(catSums).sort((a, b) => catSums[b] - catSums[a]);

  if (progressList) {
    if (sortedCategories.length === 0) {
      progressList.innerHTML = `<p style="font-size:12px;color:#94a3b8;text-align:center;padding:12px 0;">No expenses recorded yet.</p>`;
    } else {
      progressList.innerHTML = sortedCategories.map(cat => {
        const amt = catSums[cat];
        const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
        const meta = CATEGORY_MAP[cat] || { color: '#6366F1' };

        return `
          <div class="category-progress-item">
            <div class="cat-header">
              <span class="cat-name-tag">
                <span class="cat-color-dot" style="background:${meta.color};"></span>
                ${escapeHtml(cat)} (${pct}%)
              </span>
              <span class="cat-amount-tag">${formatCurrency(amt)}</span>
            </div>
            <div class="cat-progress-track">
              <div class="cat-progress-fill" style="width: ${pct}%; background: ${meta.color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Mini Chart
  if (canvas) {
    if (overviewMiniDonutChart) {
      overviewMiniDonutChart.destroy();
    }

    const labels = sortedCategories.length > 0 ? sortedCategories : ['No Expenses'];
    const data = sortedCategories.length > 0 ? sortedCategories.map(c => catSums[c]) : [1];
    const colors = sortedCategories.length > 0 ? sortedCategories.map(c => CATEGORY_MAP[c]?.color || '#94A3B8') : ['#E2E8F0'];

    const ctx = canvas.getContext('2d');
    overviewMiniDonutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => `${context.label}: ${formatCurrency(context.raw)}`
            }
          }
        }
      }
    });
  }
}
