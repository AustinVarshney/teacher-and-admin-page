import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentInfo {
  name: string;
  id: string;
  className: string;
  section: string;
  rollNumber: number;
  fatherName: string;
  dateOfBirth: string;
}

interface SubjectScore {
  subjectName: string;
  marks: number | null;
  maxMarks: number;
  grade: string;
}

interface ExamResult {
  examName: string;
  examDate?: string;
  subjectScores: SubjectScore[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  overallGrade: string;
}

interface ReportCardData {
  studentInfo: StudentInfo;
  examResults: ExamResult[];
  sessionYear: string;
  schoolName: string;
  generatedDate: string;
}

export const generateReportCard = async (data: ReportCardData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header - School Name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Report Card Title
  doc.setFontSize(16);
  doc.text('STUDENT REPORT CARD', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Session Year
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Academic Session: ${data.sessionYear}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Student Information Box
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPosition, pageWidth - 30, 40, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  yPosition += 8;

  // Student details in two columns
  const leftCol = 20;
  const rightCol = pageWidth / 2 + 10;

  doc.text('Student Name:', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.studentInfo.name, leftCol + 30, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Student ID:', rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.studentInfo.id, rightCol + 25, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Class:', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.studentInfo.className}-${data.studentInfo.section}`, leftCol + 30, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Roll Number:', rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.studentInfo.rollNumber.toString(), rightCol + 25, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'bold');
  doc.text("Father's Name:", leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.studentInfo.fatherName, leftCol + 30, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Birth:', rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.studentInfo.dateOfBirth, rightCol + 25, yPosition);
  yPosition += 15;

  // Academic Performance Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIC PERFORMANCE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Process each exam
  for (let i = 0; i < data.examResults.length; i++) {
    const exam = data.examResults[i];
    
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Exam header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(exam.examName, 15, yPosition);
    
    if (exam.examDate) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Date: ${exam.examDate}`, pageWidth - 15, yPosition, { align: 'right' });
    }
    yPosition += 5;

    // Subject-wise marks table
    const tableData = exam.subjectScores.map(subject => [
      subject.subjectName,
      subject.marks !== null ? subject.marks.toString() : '-',
      subject.maxMarks.toString(),
      subject.grade
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Subject', 'Marks Obtained', 'Max Marks', 'Grade']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        halign: 'center',
        fontSize: 9
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 30 }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 5;

    // Exam summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const summaryY = yPosition;
    doc.text(`Total: ${exam.obtainedMarks} / ${exam.totalMarks}`, 15, summaryY);
    doc.text(`Percentage: ${exam.percentage.toFixed(2)}%`, 80, summaryY);
    doc.text(`Grade: ${exam.overallGrade}`, 140, summaryY);
    
    yPosition += 10;

    // Add separator line
    if (i < data.examResults.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 10;
    }
  }

  // Overall Summary Section
  if (data.examResults.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL SUMMARY', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Calculate overall statistics
    const totalObtained = data.examResults.reduce((sum, exam) => sum + exam.obtainedMarks, 0);
    const totalMax = data.examResults.reduce((sum, exam) => sum + exam.totalMarks, 0);
    const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const overallGrade = calculateOverallGrade(overallPercentage);

    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 25, 'F');
    
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Marks Obtained:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${totalObtained} / ${totalMax}`, 80, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Percentage:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${overallPercentage.toFixed(2)}%`, 80, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Grade:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(overallGrade, 80, yPosition);
  }

  // Footer
  yPosition = pageHeight - 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on: ${data.generatedDate}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(8);
  doc.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, yPosition, { align: 'center' });

  // Save the PDF
  const fileName = `ReportCard_${data.studentInfo.name.replace(/\s+/g, '_')}_${data.sessionYear}.pdf`;
  doc.save(fileName);
};

const calculateOverallGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};
