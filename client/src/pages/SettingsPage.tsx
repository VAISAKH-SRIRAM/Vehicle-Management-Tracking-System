import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { Save, User, Shield, MapPin, Bell, Server, RefreshCw } from 'lucide-react';

// User profile schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Map settings schema
const mapSettingsSchema = z.object({
  defaultMapProvider: z.string(),
  defaultZoomLevel: z.coerce.number().min(1).max(20),
  defaultCenter: z.string(),
  distanceUnit: z.string(),
  showTrafficLayer: z.boolean().default(false),
});

// Alert settings schema
const alertSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
  speedLimitDefault: z.coerce.number().min(0),
  alertsHistory: z.coerce.number().min(1),
  highPrioritySound: z.boolean().default(true),
});

// System settings schema
const systemSettingsSchema = z.object({
  dataRefreshInterval: z.coerce.number().min(1),
  locationHistoryDays: z.coerce.number().min(1),
  apiRateLimit: z.coerce.number().min(1),
  debugMode: z.boolean().default(false),
});

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const { toast } = useToast();

  // Initialize forms
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "Admin User",
      email: "admin@example.com",
      username: "admin",
      password: "",
      confirmPassword: "",
    },
  });

  const mapSettingsForm = useForm<z.infer<typeof mapSettingsSchema>>({
    resolver: zodResolver(mapSettingsSchema),
    defaultValues: {
      defaultMapProvider: "openstreetmap",
      defaultZoomLevel: 13,
      defaultCenter: "40.7128,-74.0060",
      distanceUnit: "km",
      showTrafficLayer: false,
    },
  });

  const alertSettingsForm = useForm<z.infer<typeof alertSettingsSchema>>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      inAppNotifications: true,
      speedLimitDefault: 80,
      alertsHistory: 30,
      highPrioritySound: true,
    },
  });

  const systemSettingsForm = useForm<z.infer<typeof systemSettingsSchema>>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      dataRefreshInterval: 5,
      locationHistoryDays: 90,
      apiRateLimit: 100,
      debugMode: false,
    },
  });

  // Handle form submissions
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    console.log("Profile form data:", data);
    
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const onMapSettingsSubmit = (data: z.infer<typeof mapSettingsSchema>) => {
    console.log("Map settings form data:", data);
    
    toast({
      title: "Map settings updated",
      description: "Your map settings have been updated successfully.",
    });
  };

  const onAlertSettingsSubmit = (data: z.infer<typeof alertSettingsSchema>) => {
    console.log("Alert settings form data:", data);
    
    toast({
      title: "Alert settings updated",
      description: "Your alert settings have been updated successfully.",
    });
  };

  const onSystemSettingsSubmit = (data: z.infer<typeof systemSettingsSchema>) => {
    console.log("System settings form data:", data);
    
    toast({
      title: "System settings updated",
      description: "System settings have been updated successfully.",
    });
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>User Profile</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Map Settings</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Alert Settings</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>System Settings</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                  Manage your account information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div></div>
                      
                      <FormField
                        control={profileForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Leave blank to keep current password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Role: Administrator</span>
                      </div>
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Map Settings */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Map Settings</CardTitle>
                <CardDescription>
                  Configure map preferences and display options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...mapSettingsForm}>
                  <form onSubmit={mapSettingsForm.handleSubmit(onMapSettingsSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={mapSettingsForm.control}
                        name="defaultMapProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Map Provider</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select map provider" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="openstreetmap">OpenStreetMap</SelectItem>
                                <SelectItem value="google">Google Maps</SelectItem>
                                <SelectItem value="mapbox">Mapbox</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mapSettingsForm.control}
                        name="defaultZoomLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Zoom Level</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" max="20" />
                            </FormControl>
                            <FormDescription>
                              Value between 1 (world view) and 20 (building view)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mapSettingsForm.control}
                        name="defaultCenter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Map Center</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="latitude,longitude" />
                            </FormControl>
                            <FormDescription>
                              Format: latitude,longitude (e.g., 40.7128,-74.0060)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mapSettingsForm.control}
                        name="distanceUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distance Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="km">Kilometers (km)</SelectItem>
                                <SelectItem value="miles">Miles</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mapSettingsForm.control}
                        name="showTrafficLayer"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Traffic Layer</FormLabel>
                              <FormDescription>
                                Show traffic information on maps when available
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
                    </div>
                    
                    <CardFooter className="flex justify-end pt-4 px-0">
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Map Settings
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Alert Settings */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>
                  Configure notification preferences and alert thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...alertSettingsForm}>
                  <form onSubmit={alertSettingsForm.handleSubmit(onAlertSettingsSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={alertSettingsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive alert notifications via email
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
                        control={alertSettingsForm.control}
                        name="inAppNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">In-App Notifications</FormLabel>
                              <FormDescription>
                                Show alert notifications within the application
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
                        control={alertSettingsForm.control}
                        name="speedLimitDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Speed Limit (km/h)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" />
                            </FormControl>
                            <FormDescription>
                              Default speed limit for speed alerts when not specified
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={alertSettingsForm.control}
                        name="alertsHistory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alerts History (days)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormDescription>
                              Number of days to keep alert history
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={alertSettingsForm.control}
                        name="highPrioritySound"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">High Priority Sound</FormLabel>
                              <FormDescription>
                                Play sound for high priority alerts
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
                    </div>
                    
                    <CardFooter className="flex justify-end pt-4 px-0">
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Alert Settings
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* System Settings */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and performance options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...systemSettingsForm}>
                  <form onSubmit={systemSettingsForm.handleSubmit(onSystemSettingsSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={systemSettingsForm.control}
                        name="dataRefreshInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Refresh Interval (seconds)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormDescription>
                              How often to refresh data from the server
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemSettingsForm.control}
                        name="locationHistoryDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location History Retention (days)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormDescription>
                              Number of days to keep location history data
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemSettingsForm.control}
                        name="apiRateLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Rate Limit (requests/minute)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormDescription>
                              Maximum number of API requests per minute
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemSettingsForm.control}
                        name="debugMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Debug Mode</FormLabel>
                              <FormDescription>
                                Enable extended logging and debug information
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
                    </div>
                    
                    <div className="border-t pt-4 flex justify-between">
                      <Button variant="outline" type="button" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Reset to Defaults
                      </Button>
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save System Settings
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
