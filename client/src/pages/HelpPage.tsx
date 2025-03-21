import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { Search, Mail, HelpCircle, Book, Video, FileText, ArrowRight } from 'lucide-react';

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a search term to find help articles.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Search initiated",
      description: `Searching for "${searchTerm}"...`,
    });

    // This would typically search for help articles
    console.log("Searching for:", searchTerm);
  };

  // Handle support request
  const handleSupportRequest = () => {
    toast({
      title: "Support request sent",
      description: "Our team will contact you shortly.",
    });
  };

  // FAQ items
  const faqItems = [
    {
      question: "How do I add a new vehicle to the system?",
      answer: "To add a new vehicle, navigate to the Vehicles page from the sidebar, then click the 'Add Vehicle' button. Fill in the required information in the form that appears and click 'Add Vehicle' to save."
    },
    {
      question: "How do I create a geofence?",
      answer: "To create a geofence, go to the Geofences page, click 'Add Geofence', then draw the shape on the map. After drawing, fill in the required details in the form and click 'Create Geofence' to save it."
    },
    {
      question: "How can I track a vehicle's history?",
      answer: "To view a vehicle's history, select the vehicle from the vehicle list, then click on 'View Details'. In the vehicle details modal, you can see recent activities. For more detailed history, go to the Reports page and select the vehicle and date range."
    },
    {
      question: "How do I set up alerts for vehicles?",
      answer: "Navigate to the Geofences page to set up location-based alerts. You can configure speed alerts, geofence entry/exit, and other alert types. Adjust notification settings on the Settings page under 'Alert Settings'."
    },
    {
      question: "Can I export trip data?",
      answer: "Yes, you can export trip data from the Reports page. Select the date range and vehicle, then click the 'Export Data' button to download a CSV file with the trip information."
    },
    {
      question: "How frequently is vehicle location updated?",
      answer: "Vehicle locations are updated in real-time when data is received from the GPS device. The refresh interval can be adjusted in the System Settings page."
    },
    {
      question: "What do the different vehicle status colors mean?",
      answer: "Green indicates an active vehicle that is currently moving. Orange indicates an idle vehicle that is powered on but not moving. Red indicates an offline vehicle that is not communicating with the system."
    },
  ];

  // Quick start guides
  const quickStartGuides = [
    {
      title: "Getting Started with VMAT",
      description: "Learn the basics of the Vehicle Management and Tracking system",
      icon: <Book className="h-5 w-5" />,
    },
    {
      title: "Vehicle Tracking Tutorial",
      description: "Learn how to track vehicles in real-time",
      icon: <Video className="h-5 w-5" />,
    },
    {
      title: "Geofencing Guide",
      description: "Create and manage virtual boundaries for your vehicles",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Alerts & Notifications Setup",
      description: "Configure custom alerts for your fleet",
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ];

  // Filter FAQ items based on search term
  const filteredFaqItems = searchTerm 
    ? faqItems.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : faqItems;

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Help & Support</h2>
          <p className="text-neutral-500 max-w-3xl">
            Find answers to common questions about the VMAT System. If you need further assistance, 
            please contact our support team.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Search Help Articles</CardTitle>
              <CardDescription>Find answers to your questions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Search for help topics..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get help from our team</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-500 mb-4">
                Can't find what you're looking for? Our support team is ready to help.
              </p>
              <Button className="w-full" onClick={handleSupportRequest}>
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1">
            <h3 className="font-semibold text-lg mb-4">Quick Start Guides</h3>
            <div className="space-y-4">
              {quickStartGuides.map((guide, index) => (
                <Card key={index} className="cursor-pointer hover:bg-neutral-50 transition-colors">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                      {guide.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{guide.title}</h4>
                      <p className="text-sm text-neutral-500">{guide.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-neutral-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="col-span-2">
            <h3 className="font-semibold text-lg mb-4">Frequently Asked Questions</h3>
            <Card>
              <CardContent className="p-4">
                {filteredFaqItems.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqItems.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-neutral-600 py-2">
                            {item.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    {searchTerm ? `No FAQ matches found for "${searchTerm}"` : "No FAQs available"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Video Tutorials</CardTitle>
            <CardDescription>
              Watch step-by-step guides on how to use the VMAT System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-100 rounded-lg aspect-video flex flex-col items-center justify-center p-4 text-center">
                <Video className="h-10 w-10 text-neutral-400 mb-2" />
                <h4 className="font-medium">Getting Started Tutorial</h4>
                <p className="text-sm text-neutral-500 mt-1">5:32</p>
              </div>
              
              <div className="bg-neutral-100 rounded-lg aspect-video flex flex-col items-center justify-center p-4 text-center">
                <Video className="h-10 w-10 text-neutral-400 mb-2" />
                <h4 className="font-medium">Creating Geofences</h4>
                <p className="text-sm text-neutral-500 mt-1">3:45</p>
              </div>
              
              <div className="bg-neutral-100 rounded-lg aspect-video flex flex-col items-center justify-center p-4 text-center">
                <Video className="h-10 w-10 text-neutral-400 mb-2" />
                <h4 className="font-medium">Analyzing Trip Reports</h4>
                <p className="text-sm text-neutral-500 mt-1">4:18</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default HelpPage;
