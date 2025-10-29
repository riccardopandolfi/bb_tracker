import { Technique } from '@/types';
import { getTechniqueDefinition } from '@/lib/techniques';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface TechniqueParamsFormProps {
  technique: Technique;
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export function TechniqueParamsForm({ technique, params, onChange }: TechniqueParamsFormProps) {
  const definition = getTechniqueDefinition(technique);

  if (!definition || technique === 'Normale') {
    return null;
  }

  const handleParamChange = (paramName: string, value: string | number) => {
    onChange({
      ...params,
      [paramName]: value,
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">{definition.label}</CardTitle>
        <CardDescription className="text-xs">{definition.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {definition.parameters.map((param) => (
            <div key={param.name} className="space-y-1">
              <Label htmlFor={param.name} className="text-xs">
                {param.label}
              </Label>
              <Input
                id={param.name}
                type={param.type}
                value={params[param.name] ?? param.default}
                onChange={(e) =>
                  handleParamChange(
                    param.name,
                    param.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                  )
                }
                min={param.min}
                max={param.max}
                step={param.step}
                className="h-8"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-muted rounded text-xs">
          <strong>Schema generato:</strong>{' '}
          {definition.generateSchema(params) || 'Configura i parametri'}
        </div>
      </CardContent>
    </Card>
  );
}
