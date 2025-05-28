const API_URL = "http://localhost:5239/api/transaction";
const SUMMARY_URL = "http://localhost:5239/api/transaction/report/summary";

const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const balanceEl = document.getElementById("balance");
const ctx = document.getElementById("incomeExpenseChart").getContext("2d");

let chartInstance = null;

async function loadSummary() {
  try {
    const res = await fetch(SUMMARY_URL);
    const data = await res.json();

    balanceEl.textContent = `$ ${data.balance.toFixed(2)}`;

    return data;
  } catch (error) {
    console.error("Erro ao carregar resumo:", error);
    return null;
  }
}

//carregar transações recentes (slice 20)
async function loadTransactions() {
  try {
    const response = await fetch(API_URL);
    const transactions = await response.json();

    transactionList.innerHTML = "";

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactions.slice(0, 20).forEach((tx) => {
      const li = document.createElement("li");
      li.className =
        tx.type === "Income" ? "transaction-income" : "transaction-expense";
      li.textContent = `${new Date(tx.date).toLocaleDateString()} - ${
        tx.category
      } - R$ ${tx.amount.toFixed(2)}`;

      li.setAttribute("data-id", tx.id);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Excluir";
      li.appendChild(deleteBtn);

      transactionList.appendChild(li);
    });
  } catch (error) {
    console.error("Erro ao carregar transações:", error);
  }
}

transactionList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const li = e.target.closest("li");
    const id = li.getAttribute("data-id");

    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          li.remove();
          refreshDashboard();
        } else {
          alert("Erro ao excluir a transação.");
        }
      } catch (error) {
        console.error("Erro ao excluir transação:", error);
      }
    }
  }
});


//gráfico
function createChart(income, expense) {
  if (chartInstance) chartInstance.destroy();

  //calcula o saldo
  const balance = income - expense;
  const total = income + expense;

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [
        {
          data: [income, expense],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: ["rgba(16, 185, 129, 1)", "rgba(239, 68, 68, 1)"],
          borderWidth: 3,
          hoverBackgroundColor: [
            "rgba(16, 185, 129, 0.9)",
            "rgba(239, 68, 68, 0.9)",
          ],
          hoverBorderWidth: 4,
          cutout: "70%",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#1e293b",
            font: {
              size: 16,
              weight: "600",
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#3b82f6",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: $ ${value.toFixed(
                2
              )} (${percentage}%)`;
            },
          },
        },
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: "easeInOutCubic",
      },
      onHover: (event, elements) => {
        ctx.canvas.style.cursor = elements.length > 0 ? "pointer" : "default";
      },
    },
    plugins: [
      {
        //saldo no centro
        id: "centerText",
        beforeDraw: function (chart) {
          const ctx = chart.ctx;
          const centerX =
            chart.chartArea.left +
            (chart.chartArea.right - chart.chartArea.left) / 2;
          const centerY =
            chart.chartArea.top +
            (chart.chartArea.bottom - chart.chartArea.top) / 2;

          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.font = "bold 18px Inter";
          ctx.fillStyle = "#64748b";
          ctx.fillText("Saldo", centerX, centerY - 15);

          //valor do saldo
          ctx.font = "bold 24px Inter";
          ctx.fillStyle = balance >= 0 ? "#10b981" : "#ef4444";
          ctx.fillText(
            `$ ${Math.abs(balance).toFixed(2)}`,
            centerX,
            centerY + 15
          );

          ctx.restore();
        },
      },
    ],
  });
}

//para carregar dados e atualizar o UI
async function refreshDashboard() {
  const summary = await loadSummary();
  await loadTransactions();

  if (summary) {
    createChart(summary.totalIncome, summary.totalExpense);
  }
}

//envia uma nova transação para o backend
async function addTransaction(transaction) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) throw new Error("Erro ao adicionar transação");

    //atualiza a lista após adição
    loadTransactions();
    refreshDashboard();
  } catch (error) {
    alert(error.message);
  }
}

//submit formulário
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const transaction = {
    type: form.type.value,
    category: form.category.value,
    description: form.description.value,
    amount: parseFloat(form.amount.value),
    date: new Date().toISOString(), //data
  };

  addTransaction(transaction);
  form.reset();
});


document.getElementById("transaction-list").addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const li = e.target.closest("li");
    const id = li.getAttribute("data-id");

    if (confirm("Tem certeza que deseja excluir essa transação?")) {
      await fetch(`http://localhost:5239/api/transaction/${id}`, {
        method: "DELETE",
      });

      li.remove();
      refreshDashboard();
    }
  }
});


//excel
document.getElementById("export-excel").addEventListener("click", async () => {
    const response = await fetch(API_URL);
    const data = await response.json();

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    XLSX.writeFile(workbook, "transactions.xlsx");
});

//PDF
document.getElementById("export-table-pdf").addEventListener("click", async () => {
  const response = await fetch(API_URL);
  const data = await response.json();

  const rows = data.map((item) => [
    item.type,
    item.category,
    item.description,
    `R$ ${parseFloat(item.amount).toFixed(2)}`,
    new Date(item.date).toLocaleDateString('pt-BR')
  ]);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Your transactions", 14, 15);
  doc.autoTable({
    startY: 20,
    head: [["Type", "Category", "Description", "Value", "Date"]],
    body: rows,
    theme: "striped"
  });

  doc.save("relatory-transactions.pdf");
});

refreshDashboard();
