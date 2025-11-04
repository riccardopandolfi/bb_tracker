import { Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent } from '../ui/chart';
import { useApp } from '@/contexts/AppContext';

export function MacrosPieChart() {
  const { getCurrentMacros, currentWeek } = useApp();
  const macros = getCurrentMacros();

  // Get macros for current week
  const weekMacros = macros[currentWeek];

  // Parse macro values
  const protein = parseFloat(weekMacros?.protein || '0');
  const carbs = parseFloat(weekMacros?.carbs || '0');
  const fat = parseFloat(weekMacros?.fat || '0');
  const kcal = parseFloat(weekMacros?.kcal || '0');

  // Calculate total grams and percentages
  const totalGrams = protein + carbs + fat;
  const hasData = totalGrams > 0;

  // Prepare chart data
  const chartData = [
    {
      macro: 'protein',
      name: 'Proteine',
      value: protein,
      percentage: hasData ? ((protein / totalGrams) * 100).toFixed(1) : '0',
      kcal: (protein * 4).toFixed(0),
      fill: 'hsl(142, 71%, 45%)'
    },
    {
      macro: 'carbs',
      name: 'Carboidrati',
      value: carbs,
      percentage: hasData ? ((carbs / totalGrams) * 100).toFixed(1) : '0',
      kcal: (carbs * 4).toFixed(0),
      fill: 'hsl(217, 91%, 60%)'
    },
    {
      macro: 'fat',
      name: 'Grassi',
      value: fat,
      percentage: hasData ? ((fat / totalGrams) * 100).toFixed(1) : '0',
      kcal: (fat * 9).toFixed(0),
      fill: 'hsl(48, 96%, 53%)'
    },
  ];

  const chartConfig = {
    value: {
      label: 'Grammi',
    },
    protein: {
      label: 'Proteine',
      color: 'hsl(142, 71%, 45%)', // Verde
    },
    carbs: {
      label: 'Carboidrati',
      color: 'hsl(217, 91%, 60%)', // Blu
    },
    fat: {
      label: 'Grassi',
      color: 'hsl(48, 96%, 53%)', // Giallo
    },
  } satisfies ChartConfig;

  return (
    <Card className="min-w-0 w-full flex flex-col">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-sm sm:text-base font-medium">Macro Week {currentWeek}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {hasData ? `${kcal.toFixed(0)} kcal totali` : 'Nessun dato disponibile'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-3 sm:pb-4">
        {hasData ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px] sm:max-h-[250px]"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap gap-1 sm:gap-2 [&>*]:basis-1/3 [&>*]:justify-center text-xs"
                />
              </PieChart>
            </ChartContainer>
            <div className="mt-2 sm:mt-3 grid grid-cols-3 gap-1 sm:gap-2 text-center">
              {chartData.map((item) => (
                <div key={item.name} className="space-y-0.5">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm font-bold">{item.value}g</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{item.kcal} kcal</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[200px] sm:h-[250px] text-xs sm:text-sm text-muted-foreground px-4 text-center">
            Configura i macro nella tab Macros
          </div>
        )}
      </CardContent>
    </Card>
  );
}
