import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

/**
 * DEPRECATED: This component was used for weekly macros per program.
 * The app now uses daily macros instead of weekly macros per program.
 * See MacrosTab for the new daily macros system.
 */
export function MacrosSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrizione e Macronutrienti</CardTitle>
        <CardDescription>Funzionalità deprecata</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-sm text-muted-foreground">
          Questa funzionalità è stata sostituita dal sistema di macro giornalieri nella tab Macros.
          I macro non sono più legati ai programmi ma sono configurabili per ogni giorno della settimana.
        </div>
      </CardContent>
    </Card>
  );
}
