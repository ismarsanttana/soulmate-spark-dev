import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

interface PDFReportData {
  title: string;
  data: any;
  type: "geral" | "protocolos" | "agendamentos" | "ponto-eletronico";
}

interface TimeclockReportData {
  employee: {
    full_name: string;
    cpf: string;
    funcao: string;
    matricula: string;
    jornada?: string;
  };
  month: string;
  year: string;
  records: Array<{
    clock_in: string;
    clock_out: string | null;
    location?: string;
    notes?: string;
  }>;
  totalHours: string;
  generatedBy: string;
}

export const generatePDFReport = async ({ title, data, type }: PDFReportData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, margin, currentY);
  currentY += 10;

  // Timestamp
  const now = new Date();
  const timestamp = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR")}`;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Gerado em: ${timestamp}`, margin, currentY);
  currentY += 15;

  // Content based on type
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");

  if (type === "geral") {
    // Statistics section
    pdf.setFont("helvetica", "bold");
    pdf.text("Estatísticas Gerais", margin, currentY);
    currentY += 8;
    pdf.setFont("helvetica", "normal");

    const stats = [
      { label: "Total de Usuários Cadastrados", value: data.totalUsers },
      { label: "Secretarias Ativas", value: data.totalSecretarias },
      { label: "Total de Protocolos", value: data.totalProtocols },
      { label: "Protocolos Abertos", value: data.protocolsOpen },
      { label: "Protocolos Encerrados", value: data.protocolsClosed },
      { label: "Total de Agendamentos", value: data.totalAppointments },
      { label: "Agendamentos Pendentes", value: data.appointmentsPending },
      { label: "Notícias Publicadas", value: data.totalNews },
      { label: "Eventos Cadastrados", value: data.totalEvents },
      {
        label: "Taxa de Resolução de Protocolos",
        value: `${Math.round(((data.protocolsClosed || 0) / (data.totalProtocols || 1)) * 100)}%`,
      },
    ];

    stats.forEach((stat) => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(`${stat.label}: ${stat.value}`, margin, currentY);
      currentY += 7;
    });

    // Performance indicators
    currentY += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Indicadores de Desempenho", margin, currentY);
    currentY += 8;
    pdf.setFont("helvetica", "normal");

    const indicators = [
      {
        label: "Eficiência no Atendimento",
        value: `${Math.round((data.protocolsClosed / data.totalProtocols) * 100) || 0}%`,
      },
      {
        label: "Demanda de Agendamentos",
        value: `${data.appointmentsPending} pendentes de ${data.totalAppointments} totais`,
      },
      {
        label: "Engajamento do Portal",
        value: `${data.totalNews} notícias e ${data.totalEvents} eventos`,
      },
    ];

    indicators.forEach((indicator) => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(`${indicator.label}: ${indicator.value}`, margin, currentY);
      currentY += 7;
    });
  }

  // Footer with detailed timestamp
  const addFooter = (pageNum: number) => {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    const footerText = `Gerado em: ${now.toLocaleDateString("pt-BR")} às ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} - Página ${pageNum}`;
    pdf.text(footerText, margin, pageHeight - 10);
  };

  // Add footer to all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(i);
  }

  // Save PDF
  const fileName = `relatorio_${type}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}.pdf`;
  pdf.save(fileName);
};

export const generateTimeclockPDF = async (reportData: TimeclockReportData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  const now = new Date();
  const reportId = `${reportData.employee.matricula}-${now.getTime()}`;
  
  // Generate QR Code
  const qrCodeDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      reportId,
      employeeMatricula: reportData.employee.matricula,
      employeeName: reportData.employee.full_name,
      month: reportData.month,
      year: reportData.year,
      generatedAt: now.toISOString(),
      generatedBy: reportData.generatedBy,
      totalHours: reportData.totalHours,
    }),
    { width: 150, margin: 1 }
  );

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("Relatório de Ponto Eletrônico", margin, currentY);
  currentY += 10;

  // Timestamp
  const timestamp = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR")}`;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Gerado em: ${timestamp}`, margin, currentY);
  currentY += 5;
  pdf.text(`Gerado por: ${reportData.generatedBy}`, margin, currentY);
  currentY += 15;

  // Employee Info
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Informações do Funcionário", margin, currentY);
  currentY += 8;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Nome: ${reportData.employee.full_name}`, margin, currentY);
  currentY += 6;
  pdf.text(`CPF: ${reportData.employee.cpf}`, margin, currentY);
  currentY += 6;
  pdf.text(`Matrícula: ${reportData.employee.matricula}`, margin, currentY);
  currentY += 6;
  pdf.text(`Função: ${reportData.employee.funcao}`, margin, currentY);
  currentY += 6;
  if (reportData.employee.jornada) {
    pdf.text(`Jornada: ${reportData.employee.jornada}`, margin, currentY);
    currentY += 6;
  }
  pdf.text(`Período: ${reportData.month}/${reportData.year}`, margin, currentY);
  currentY += 10;

  // Summary
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Resumo do Período", margin, currentY);
  currentY += 8;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Total de Horas Trabalhadas: ${reportData.totalHours}`, margin, currentY);
  pdf.text(`Total de Registros: ${reportData.records.length}`, margin + 100, currentY);
  currentY += 15;

  // Records Table
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Registros de Ponto", margin, currentY);
  currentY += 8;

  // Table headers
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Data/Hora Entrada", margin, currentY);
  pdf.text("Data/Hora Saída", margin + 50, currentY);
  pdf.text("Horas", margin + 100, currentY);
  pdf.text("Local", margin + 120, currentY);
  currentY += 5;

  // Table content
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  reportData.records.forEach((record) => {
    if (currentY > pageHeight - 40) {
      pdf.addPage();
      currentY = margin;
    }

    const clockIn = new Date(record.clock_in);
    const clockInStr = `${clockIn.toLocaleDateString("pt-BR")} ${clockIn.toLocaleTimeString("pt-BR")}`;
    
    let clockOutStr = "Em andamento";
    let duration = "---";
    
    if (record.clock_out) {
      const clockOut = new Date(record.clock_out);
      clockOutStr = `${clockOut.toLocaleDateString("pt-BR")} ${clockOut.toLocaleTimeString("pt-BR")}`;
      const diff = clockOut.getTime() - clockIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${hours}h${minutes.toString().padStart(2, "0")}m`;
    }

    pdf.text(clockInStr, margin, currentY);
    pdf.text(clockOutStr, margin + 50, currentY);
    pdf.text(duration, margin + 100, currentY);
    pdf.text(record.location || "---", margin + 120, currentY);
    currentY += 5;

    if (record.notes) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.text(`Obs: ${record.notes}`, margin + 5, currentY);
      currentY += 4;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
    }
  });

  // Add QR Code
  currentY += 10;
  if (currentY > pageHeight - 60) {
    pdf.addPage();
    currentY = margin;
  }

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Código de Autenticação do Relatório", margin, currentY);
  currentY += 5;
  
  pdf.addImage(qrCodeDataUrl, "PNG", margin, currentY, 40, 40);
  
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  currentY += 45;
  pdf.text(`ID do Relatório: ${reportId}`, margin, currentY);

  // Footer with detailed timestamp on all pages
  const addFooter = (pageNum: number) => {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    const footerText = `Gerado em: ${now.toLocaleDateString("pt-BR")} às ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} - Página ${pageNum}`;
    pdf.text(footerText, margin, pageHeight - 10);
  };

  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(i);
  }

  // Save PDF
  const fileName = `ponto_eletronico_${reportData.employee.matricula}_${reportData.month}_${reportData.year}.pdf`;
  pdf.save(fileName);
};
