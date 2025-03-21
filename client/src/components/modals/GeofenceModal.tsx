import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { insertGeofenceSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@shared/schema';

interface GeofenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onDrawStart?: (type: string) => void;
  coordinates?: any;
}

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  type: z.string().min(1, 'Please select a geofence type'),
  color: z.string().default('#ff0000'),
  alertOnEnter: z.boolean().default(true),
  alertOnExit: z.boolean().default(true),
  alertOnSpeed: z.boolean().default(false),
  speedLimit: z.number().optional(),
  vehicleIds: z.array(z.number()).optional(),
});

const GeofenceModal = ({ open, onOpenChange, vehicles, onDrawStart, coordinates }: GeofenceModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'circle',
      color: '#ff0000',
      alertOnEnter: true,
      alertOnExit: true,
      alertOnSpeed: false,
      speedLimit: undefined,
      vehicleIds: undefined,
    },
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!coordinates) {
      toast({
        title: 'Missing coordinates',
        description: 'Please draw the geofence on the map first.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const geofenceData = {
        ...data,
        coordinates: coordinates,
      };
      
      const response = await apiRequest('POST', '/api/geofences', geofenceData);
      
      if (response.ok) {
        toast({
          title: 'Geofence created successfully',
          description: `${data.name} has been added to your geofences.`,
        });
        
        // Reset form and close modal
        form.reset();
        onOpenChange(false);
        
        // Invalidate geofences query to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
      }
    } catch (error) {
      console.error('Error creating geofence:', error);
      toast({
        title: 'Failed to create geofence',
        description: 'An error occurred while creating the geofence.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTypeChange = (value: string) => {
    form.setValue('type', value);
    
    // Notify parent component to start drawing
    if (onDrawStart) {
      onDrawStart(value);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-50">
        <DialogHeader>
          <DialogTitle>Create Geofence</DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-neutral-400 mb-4">
          Draw a geofence on the map and set up alerts for when vehicles enter or exit this area.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geofence Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Warehouse Zone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <RadioGroup 
                    defaultValue={field.value} 
                    onValueChange={handleTypeChange}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="circle" id="circle" />
                      <Label htmlFor="circle">Circle</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="polygon" id="polygon" />
                      <Label htmlFor="polygon">Polygon</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rectangle" id="rectangle" />
                      <Label htmlFor="rectangle">Rectangle</Label>
                    </div>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="alertOnEnter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Alert on Enter</FormLabel>
                    <FormDescription>
                      Receive alerts when vehicles enter this area
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="alertOnExit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Alert on Exit</FormLabel>
                    <FormDescription>
                      Receive alerts when vehicles exit this area
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="alertOnSpeed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Speed Limit Alerts</FormLabel>
                    <FormDescription>
                      Receive alerts when vehicles exceed speed limit in this area
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch('alertOnSpeed') && (
              <FormField
                control={form.control}
                name="speedLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speed Limit (km/h)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 50" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2">
                    {['#ff0000', '#1976D2', '#388E3C', '#F57C00', '#9C27B0'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full ${field.value === color ? 'border-2 border-white ring-2' : ''}`}
                        style={{ backgroundColor: color, boxShadow: field.value === color ? `0 0 0 2px ${color}` : 'none' }}
                        onClick={() => form.setValue('color', color)}
                      />
                    ))}
                    <Input
                      type="color"
                      className="w-6 h-6 p-0 border-0"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vehicleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Vehicles</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (value === 'all') {
                        field.onChange(vehicles.map(v => v.id));
                      } else if (value === 'custom') {
                        field.onChange([]);
                      } else {
                        field.onChange([]);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose vehicles..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      <SelectItem value="none">No Vehicles</SelectItem>
                      <SelectItem value="custom">Custom Selection...</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !coordinates}>
                {isSubmitting ? 'Creating...' : 'Create Geofence'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GeofenceModal;

