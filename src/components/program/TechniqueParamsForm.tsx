import { Technique } from '@/types';
import { getTechniqueDefinition } from '@/lib/techniques';
import { useApp } from '@/contexts/AppContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface TechniqueParamsFormProps {
  technique: Technique;
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export function TechniqueParamsForm({ technique, params, onChange }: TechniqueParamsFormProps) {
  const { customTechniques } = useApp();
  const definition = getTechniqueDefinition(technique);
  const customTechnique = customTechniques.find(t => t.name === technique);

  if (technique === 'Normale') {
    return null;
  }

  const handleParamChange = (paramName: string, value: string | number) => {
    onChange({
      ...params,
      [paramName]: value,
    });
  };

  // Custom technique
  if (customTechnique) {
    // Generate schema from params (simple concatenation for numbers)
    const generateCustomSchema = () => {
      const values = customTechnique.parameters
        .map(p => params[p.name] ?? p.defaultValue)
        .filter(v => v !== undefined && v !== '');

      // If all values are numbers, join with +
      if (values.every(v => !isNaN(Number(v)))) {
        return values.join('+');
      }
      return values.join('-');
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">{customTechnique.name}</CardTitle>
          <CardDescription className="text-xs">{customTechnique.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {customTechnique.parameters.map((param) => (
              <div key={param.name} className="space-y-1">
                <Label htmlFor={param.name} className="text-xs">
                  {param.label}
                </Label>
                {param.type === 'select' && param.options ? (
                  <Select
                    value={params[param.name] ?? param.defaultValue}
                    onValueChange={(v) => handleParamChange(param.name, v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={param.name}
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={params[param.name] ?? param.defaultValue}
                    onChange={(e) =>
                      handleParamChange(
                        param.name,
                        param.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                      )
                    }
                    className="h-8"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-muted rounded text-xs">
            <strong>Schema generato:</strong>{' '}
            {generateCustomSchema() || 'Configura i parametri'}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default techniques
  if (!definition) {
    return null;
  }

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
