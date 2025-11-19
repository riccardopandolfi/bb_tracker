import { useState, useEffect } from 'react';
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
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalValues({});
  }, [technique]);

  // Pulisci i localValues campo per campo quando i params dal parent vengono aggiornati
  useEffect(() => {
    if (Object.keys(localValues).length === 0) return;

    // Controlla ogni campo individualmente e rimuovi quelli sincronizzati
    const newLocalValues = { ...localValues };
    let hasChanges = false;

    Object.keys(localValues).forEach(key => {
      const localVal = localValues[key];
      const paramVal = params[key];

      // Se il valore locale è vuoto, non fare nulla
      if (localVal === '') return;

      // Se è "MAX" e corrisponde, rimuovilo
      if (localVal === 'MAX') {
        if (paramVal === 'MAX') {
          delete newLocalValues[key];
          hasChanges = true;
        }
        return;
      }

      // Parse il valore locale come numero se possibile
      const localNum = parseFloat(localVal);

      // Se è un numero valido e corrisponde al param, rimuovilo
      if (!isNaN(localNum)) {
        if (paramVal === localNum) {
          delete newLocalValues[key];
          hasChanges = true;
        }
      } else {
        // Se non è un numero e corrisponde come stringa, rimuovilo
        if (paramVal === localVal) {
          delete newLocalValues[key];
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setLocalValues(newLocalValues);
    }
  }, [params, localValues]);

  if (technique === 'Normale') {
    return null;
  }

  const handleParamChange = (paramName: string, value: string | number) => {
    const newParams = {
      ...params,
      [paramName]: value,
    };
    onChange(newParams);
  };

  // Custom technique
  if (customTechnique) {
    // Generate schema from params (simple concatenation for numbers)
    const generateCustomSchema = () => {
      const values = customTechnique.parameters
        .map(p => {
          // Use local value if editing, otherwise use params
          if (localValues[p.name] !== undefined) {
            if (p.type === 'number') {
              if (localValues[p.name] === '') {
                return p.defaultValue;
              }
              if (localValues[p.name] === 'MAX') {
                return 'MAX';
              }
              const parsed = parseFloat(localValues[p.name]);
              return isNaN(parsed) ? p.defaultValue : parsed;
            }
            return localValues[p.name];
          }
          return params[p.name] ?? p.defaultValue;
        })
        .filter(v => v !== undefined && v !== '');

      // If all values are numbers, join with +, otherwise join with + but handle MAX
      if (values.every(v => v === 'MAX' || !isNaN(Number(v)))) {
        return values.join('+');
      }
      return values.join('-');
    };

    return (
      <Card className="mt-4 shadow-premium border-none">
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
                    type="text"
                    value={localValues[param.name] !== undefined ? localValues[param.name] : (params[param.name] ?? param.defaultValue)}
                    onChange={(e) => {
                      let value = e.target.value;

                      // Se è un parametro numerico, converti "max" in "MAX" e valida
                      if (param.type === 'number') {
                        value = value.toUpperCase();
                        // Permetti solo numeri o "MAX"
                        if (value !== '' && value !== 'MAX' && !/^\d+\.?\d*$/.test(value)) {
                          return; // Ignora input non valido
                        }
                      }

                      setLocalValues(prev => ({ ...prev, [param.name]: value }));

                      // Aggiorna immediatamente il parent
                      if (param.type === 'number') {
                        if (value === '') {
                          handleParamChange(param.name, param.defaultValue);
                        } else if (value === 'MAX') {
                          handleParamChange(param.name, 'MAX');
                        } else {
                          const parsed = parseFloat(value);
                          if (!isNaN(parsed)) {
                            handleParamChange(param.name, parsed);
                          }
                        }
                      } else {
                        handleParamChange(param.name, value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={() => {
                      // I localValues verranno cancellati dal useEffect quando params si aggiorna
                    }}
                    placeholder={param.type === 'number' ? 'numero o MAX' : ''}
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

  // Create merged params with local values for live schema preview
  const getLiveParams = () => {
    const mergedParams: Record<string, any> = { ...params };
    Object.keys(localValues).forEach(key => {
      const param = definition.parameters.find(p => p.name === key);
      if (param && param.type === 'number') {
        if (localValues[key] === '') {
          mergedParams[key] = param.default;
        } else if (localValues[key] === 'MAX') {
          mergedParams[key] = 'MAX';
        } else {
          const parsed = parseFloat(localValues[key]);
          mergedParams[key] = isNaN(parsed) ? param.default : parsed;
        }
      } else {
        mergedParams[key] = localValues[key];
      }
    });
    return mergedParams;
  };

  return (
    <Card className="mt-4 shadow-premium border-none">
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
                type="text"
                value={localValues[param.name] !== undefined ? localValues[param.name] : (params[param.name] ?? param.default)}
                onChange={(e) => {
                  let value = e.target.value;

                  // Se è un parametro numerico, converti "max" in "MAX" e valida
                  if (param.type === 'number') {
                    value = value.toUpperCase();
                    // Permetti solo numeri o "MAX"
                    if (value !== '' && value !== 'MAX' && !/^\d+\.?\d*$/.test(value)) {
                      return; // Ignora input non valido
                    }
                  }

                  setLocalValues(prev => ({ ...prev, [param.name]: value }));

                  // Aggiorna immediatamente il parent
                  if (param.type === 'number') {
                    if (value === '') {
                      handleParamChange(param.name, param.default);
                    } else if (value === 'MAX') {
                      handleParamChange(param.name, 'MAX');
                    } else {
                      const parsed = parseFloat(value);
                      if (!isNaN(parsed)) {
                        handleParamChange(param.name, parsed);
                      }
                    }
                  } else {
                    handleParamChange(param.name, value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                onBlur={() => {
                  // I localValues verranno cancellati dal useEffect quando params si aggiorna
                }}
                placeholder={param.type === 'number' ? 'numero o MAX' : ''}
                className="h-8"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-muted rounded text-xs">
          <strong>Schema generato:</strong>{' '}
          {definition.generateSchema(getLiveParams()) || 'Configura i parametri'}
        </div>
      </CardContent>
    </Card>
  );
}
