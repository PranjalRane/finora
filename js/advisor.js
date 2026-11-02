/**
 * ========================================================
 * FINORA – AI Financial Advisor & Rule-Based Intelligence
 * ========================================================
 */

// Category Classification for 50/30/20 Budget Rule
const NEEDS_CATEGORIES = ['Housing & Rent', 'Utilities', 'Healthcare', 'Food & Dining'];
const WANTS_CATEGORIES = ['Shopping', 'Entertainment', 'Travel', 'Personal Care'];

/**
 * Generate comprehensive AI Advisor metrics and insights
 */
function updateAdvisorViews(transactions) {
  const totals = calculateFinancialTotals(transactions);
  const healthData = calculateFinancialHealthScore(totals, transactions);
  const budgetRuleData = calculate50_30_20Rule(totals, transactions);
  const insights = generateSmartFinancialInsights(totals, transactions, healthData);

  renderHealthScoreMeter(healthData);
  renderBudgetRuleAudit(budgetRuleData);
  renderAdvisorInsights(insights);
}

/**
 * Basic Financial Totals Helper
 */
function calculateFinancialTotals(transactions) {
  let income = 0;
  let spending = 0;

  transactions.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      income += amt;
    } else {
      spending += amt;
    }
  });

  const balance = income - spending;
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - spending) / income) * 100)) : 0;

  return { income, spending, balance, savingsRate, count: transactions.length };
}

/**
 * Calculate Finora Financial Health Score (0 - 100)
 */
function calculateFinancialHealthScore(totals, transactions) {
  if (transactions.length === 0) {
    return {
      score: 50,
      rating: 'New Account',
      class: 'rating-good',
      color: '#4F46E5',
      summary: 'Add your regular income and expenses to receive your personalized health score.'
    };
  }

  let score = 0;

  // 1. Savings Rate Component (0 - 35 points)
  if (totals.savingsRate >= 35) score += 35;
  else if (totals.savingsRate >= 20) score += 28;
  else if (totals.savingsRate >= 10) score += 18;
  else if (totals.savingsRate > 0) score += 8;

  // 2. Net Cash Flow Positivity (0 - 25 points)
  if (totals.income > totals.spending * 1.3) score += 25;
  else if (totals.income > totals.spending) score += 18;
  else if (totals.income === totals.spending) score += 10;
  else score += 0; // Deficit

  // 3. Spending Diversification (0 - 20 points)
  const expenses = transactions.filter(t => t.type === 'expense');
  const catSums = {};
  expenses.forEach(t => {
    catSums[t.category] = (catSums[t.category] || 0) + parseFloat(t.amount || 0);
  });

  let maxCatShare = 0;
  if (totals.spending > 0) {
    Object.values(catSums).forEach(amt => {
      const share = amt / totals.spending;
      if (share > maxCatShare) maxCatShare = share;
    });
  }

  if (maxCatShare <= 0.35) score += 20;
  else if (maxCatShare <= 0.50) score += 14;
  else score += 8;

  // 4. Activity & Buffer (0 - 20 points)
  if (totals.balance > 0) {
    score += 20;
  } else if (totals.balance === 0) {
    score += 10;
  }

  // Clamp 0 - 100
  score = Math.min(100, Math.max(10, score));

  let rating = 'Fair';
  let ratingClass = 'rating-fair';
  let color = '#F59E0B';

  if (score >= 80) {
    rating = 'Excellent';
    ratingClass = 'rating-excellent';
    color = '#10B981';
  } else if (score >= 65) {
    rating = 'Good';
    ratingClass = 'rating-good';
    color = '#4F46E5';
  } else if (score < 45) {
    rating = 'Needs Attention';
    ratingClass = 'rating-poor';
    color = '#EF4444';
  }

  return { score, rating, class: ratingClass, color };
}

/**
 * 50 / 30 / 20 Budget Rule Analysis
 */
function calculate50_30_20Rule(totals, transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  let needsTotal = 0;
  let wantsTotal = 0;

  expenses.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (NEEDS_CATEGORIES.includes(t.category)) {
      needsTotal += amt;
    } else {
      wantsTotal += amt;
    }
  });

  const income = totals.income > 0 ? totals.income : (totals.spending || 1);
  const needsPct = Math.round((needsTotal / income) * 100);
  const wantsPct = Math.round((wantsTotal / income) * 100);
  const savingsPct = totals.savingsRate;

  return {
    needs: { actual: needsPct, target: 50, amount: needsTotal },
    wants: { actual: wantsPct, target: 30, amount: wantsTotal },
    savings: { actual: savingsPct, target: 20, amount: Math.max(0, totals.balance) }
  };
}

/**
 * Generate Rule-Based Dynamic Financial Insights
 */
function generateSmartFinancialInsights(totals, transactions, healthData) {
  const insights = [];

  // Insight 1: Savings Momentum
  if (totals.savingsRate >= 20) {
    insights.push({
      type: 'success',
      icon: 'fa-arrow-trend-up',
      title: 'Strong Savings Momentum',
      description: `Your savings rate is currently ${totals.savingsRate}%, which comfortably beats the recommended 20% benchmark. You are on track for long-term wealth growth.`
    });
  } else if (totals.income > 0 && totals.savingsRate < 10) {
    insights.push({
      type: 'warning',
      icon: 'fa-piggy-bank',
      title: 'Low Savings Margin Alert',
      description: `You are currently saving ${totals.savingsRate}% of your income. Aim to automatically transfer at least 15-20% to savings immediately upon payday.`
    });
  }

  // Insight 2: Deficit Check
  if (totals.spending > totals.income && totals.income > 0) {
    insights.push({
      type: 'alert',
      icon: 'fa-triangle-exclamation',
      title: 'Cash Outflow Exceeds Inflow',
      description: `Total expenses exceed income by ${formatCurrency(totals.spending - totals.income)}. Consider pausing non-essential discretionary purchases until next cycle.`
    });
  }

  // Insight 3: Category Outlier Analysis
  const expenses = transactions.filter(t => t.type === 'expense');
  const catSums = {};
  expenses.forEach(t => {
    catSums[t.category] = (catSums[t.category] || 0) + parseFloat(t.amount || 0);
  });

  let topCategory = null;
  let topAmount = 0;
  for (const [cat, amt] of Object.entries(catSums)) {
    if (amt > topAmount) {
      topAmount = amt;
      topCategory = cat;
    }
  }

  if (topCategory && totals.spending > 0) {
    const catPercent = Math.round((topAmount / totals.spending) * 100);
    if (catPercent >= 30) {
      insights.push({
        type: 'info',
        icon: 'fa-chart-pie',
        title: `Dominant Category: ${topCategory}`,
        description: `${topCategory} accounts for ${catPercent}% (${formatCurrency(topAmount)}) of your total spending. Look for small optimization opportunities here.`
      });
    }
  }

  // Insight 4: Emergency Fund Buffer Recommendation
  const avgMonthlyBurn = totals.spending > 0 ? totals.spending : 1200;
  const targetBuffer = avgMonthlyBurn * 3;
  insights.push({
    type: 'info',
    icon: 'fa-shield-halved',
    title: 'Emergency Fund Target',
    description: `A 3-month safety cushion requires approximately ${formatCurrency(targetBuffer)}. Keep this in an accessible high-yield savings account.`
  });

  // Insight 5: Positive Activity Confirmation
  if (transactions.length >= 5) {
    insights.push({
      type: 'success',
      icon: 'fa-circle-check',
      title: 'Consistent Record Keeping',
      description: `You have logged ${transactions.length} transactions. Consistent tracking is statistically proven to reduce impulse purchases by up to 18%.`
    });
  }

  return insights;
}

/**
 * Render Health Score Circle SVG
 */
function renderHealthScoreMeter(healthData) {
  const scoreValEl = document.getElementById('healthScoreVal');
  const scoreCircle = document.getElementById('healthScoreCircle');
  const ratingBadge = document.getElementById('healthScoreBadge');

  if (scoreValEl) scoreValEl.textContent = healthData.score;

  if (scoreCircle) {
    // Total circumference = 2 * PI * 60 ≈ 377
    const circumference = 377;
    const offset = circumference - (circumference * (healthData.score / 100));
    scoreCircle.style.strokeDashoffset = offset;
    scoreCircle.style.stroke = healthData.color;
  }

  if (ratingBadge) {
    ratingBadge.textContent = healthData.rating;
    ratingBadge.className = `score-rating-badge ${healthData.class}`;
  }
}

/**
 * Render 50 / 30 / 20 Budget Rule Progress Bars
 */
function renderBudgetRuleAudit(budgetData) {
  const container = document.getElementById('budgetRuleBars');
  if (!container) return;

  container.innerHTML = `
    <div class="rule-bar-card">
      <div class="rule-bar-title">
        <span>Needs (Rent, Utilities, Food)</span>
        <strong>${budgetData.needs.actual}% / 50%</strong>
      </div>
      <div class="rule-bar-track">
        <div class="rule-bar-fill" style="width: ${Math.min(100, budgetData.needs.actual)}%; background: ${budgetData.needs.actual <= 50 ? '#10B981' : '#F59E0B'};"></div>
      </div>
      <div class="rule-bar-status" style="color: ${budgetData.needs.actual <= 50 ? '#059669' : '#D97706'};">
        ${budgetData.needs.actual <= 50 ? '✓ On target' : '⚠️ Above 50% target'}
      </div>
    </div>

    <div class="rule-bar-card">
      <div class="rule-bar-title">
        <span>Wants (Shopping, Leisure)</span>
        <strong>${budgetData.wants.actual}% / 30%</strong>
      </div>
      <div class="rule-bar-track">
        <div class="rule-bar-fill" style="width: ${Math.min(100, budgetData.wants.actual)}%; background: ${budgetData.wants.actual <= 30 ? '#10B981' : '#EF4444'};"></div>
      </div>
      <div class="rule-bar-status" style="color: ${budgetData.wants.actual <= 30 ? '#059669' : '#DC2626'};">
        ${budgetData.wants.actual <= 30 ? '✓ Within budget' : '⚠️ Exceeding 30%'}
      </div>
    </div>

    <div class="rule-bar-card">
      <div class="rule-bar-title">
        <span>Savings & Investments</span>
        <strong>${budgetData.savings.actual}% / 20%</strong>
      </div>
      <div class="rule-bar-track">
        <div class="rule-bar-fill" style="width: ${Math.min(100, budgetData.savings.actual)}%; background: #4F46E5;"></div>
      </div>
      <div class="rule-bar-status" style="color: ${budgetData.savings.actual >= 20 ? '#059669' : '#64748B'};">
        ${budgetData.savings.actual >= 20 ? '✓ Target achieved' : 'Target: 20%+'}
      </div>
    </div>
  `;
}

/**
 * Render Advisor Insights List
 */
function renderAdvisorInsights(insights) {
  const container = document.getElementById('advisorInsightsList');
  if (!container) return;

  const iconClasses = {
    success: 'insight-icon-success',
    warning: 'insight-icon-warning',
    alert: 'insight-icon-alert',
    info: 'insight-icon-info'
  };

  container.innerHTML = insights.map(item => `
    <div class="insight-item">
      <div class="insight-icon ${iconClasses[item.type] || 'insight-icon-info'}">
        <i class="fa-solid ${item.icon}"></i>
      </div>
      <div class="insight-content">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.description)}</p>
      </div>
    </div>
  `).join('');
}
