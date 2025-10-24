import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { UserCheck, UserX, Calendar, Stethoscope } from "lucide-react";

interface EmployeeAttendanceChartProps {
  secretariaSlug: string;
}

export function EmployeeAttendanceChart({ secretariaSlug }: EmployeeAttendanceChartProps) {
  const today = new Date().toISOString().split("T")[0];

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-attendance", secretariaSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_employees")
        .select("id")
        .eq("secretaria_slug", secretariaSlug)
        .eq("situacao", "ativo");

      if (error) throw error;
      return data || [];
    },
  });

  const { data: absences = [] } = useQuery({
    queryKey: ["employee-absences-today", secretariaSlug, today],
    queryFn: async () => {
      const { data: employeeIds } = await supabase
        .from("secretaria_employees")
        .select("id")
        .eq("secretaria_slug", secretariaSlug)
        .eq("situacao", "ativo");

      if (!employeeIds || employeeIds.length === 0) return [];

      const { data, error } = await supabase
        .from("employee_absences")
        .select("*")
        .in("employee_id", employeeIds.map(e => e.id))
        .eq("absence_date", today);

      if (error) throw error;
      return data || [];
    },
  });

  const totalEmployees = employees.length;
  const onVacation = absences.filter(a => a.absence_type === "ferias").length;
  const absent = absences.filter(a => a.absence_type === "falta").length;
  const onLeave = absences.filter(a => a.absence_type === "atestado" || a.absence_type === "licenca").length;
  const present = Math.max(0, totalEmployees - onVacation - absent - onLeave);

  const chartData = [
    { name: "Presentes", value: present, color: "hsl(var(--chart-1))" },
    { name: "Férias", value: onVacation, color: "hsl(var(--chart-2))" },
    { name: "Faltas", value: absent, color: "hsl(var(--chart-3))" },
    { name: "Atestado/Licença", value: onLeave, color: "hsl(var(--chart-4))" },
  ].filter(item => item.value > 0);

  const stats = [
    {
      label: "Presentes",
      value: present,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Férias",
      value: onVacation,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Faltas",
      value: absent,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Atestados",
      value: onLeave,
      icon: Stethoscope,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Presença de Funcionários</CardTitle>
          <CardDescription>Status da equipe hoje ({new Date().toLocaleDateString()})</CardDescription>
        </CardHeader>
        <CardContent>
          {totalEmployees === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário cadastrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}