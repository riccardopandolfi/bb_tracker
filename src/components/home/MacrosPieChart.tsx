import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

/**
 * DEPRECATED: This component was used for weekly macros visualization.
 * The app now uses daily macros instead of weekly macros.
 * See MacrosTab for the new daily macros system.
 */
export function MacrosPieChart() {
  return (
    <Card className="min-w-0 w-full flex flex-col">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-sm sm:text-base font-medium">Macro Settimanali</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Funzionalità deprecata
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-3 sm:pb-4">
        <div className="flex items-center justify-center h-[200px] sm:h-[250px] text-xs sm:text-sm text-muted-foreground px-4 text-center">
          Questa funzionalità è stata sostituita dal sistema di macro giornalieri nella tab Macros
        </div>
      </CardContent>
    </Card>
  );
}
