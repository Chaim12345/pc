export const boardTemplates = [
  // Development Templates
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    description: 'Organize your agile sprints with tasks, stories, and sprint goals',
    category: 'Development',
    icon: '🚀',
    columns: [
      { name: 'Task', type: 'text' },
      { name: 'Status', type: 'status', settings: { labels: ['Backlog', 'In Progress', 'Testing', 'Done'] } },
      { name: 'Assignee', type: 'person' },
      { name: 'Priority', type: 'priority', settings: { labels: ['Critical', 'High', 'Medium', 'Low'] } },
      { name: 'Story Points', type: 'number' },
      { name: 'Sprint', type: 'text' },
      { name: 'Due Date', type: 'date' },
    ],
    groups: [
      { 
        name: 'Sprint 1', 
        items: [
          {
            name: 'Implement user authentication',
            columnValues: [
              { columnIndex: 1, value: 'In Progress' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: 8 },
              { columnIndex: 5, value: 'Sprint 1' },
              { columnIndex: 6, value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
          {
            name: 'Design dashboard UI',
            columnValues: [
              { columnIndex: 1, value: 'Backlog' },
              { columnIndex: 3, value: 'Medium' },
              { columnIndex: 4, value: 5 },
              { columnIndex: 5, value: 'Sprint 1' },
              { columnIndex: 6, value: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
          {
            name: 'Setup CI/CD pipeline',
            columnValues: [
              { columnIndex: 1, value: 'Done' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: 3 },
              { columnIndex: 5, value: 'Sprint 1' },
              { columnIndex: 6, value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Backlog', 
        items: [
          {
            name: 'Add dark mode support',
            columnValues: [
              { columnIndex: 1, value: 'Backlog' },
              { columnIndex: 3, value: 'Low' },
              { columnIndex: 4, value: 5 },
              { columnIndex: 5, value: 'Future' },
            ],
          },
          {
            name: 'Implement search functionality',
            columnValues: [
              { columnIndex: 1, value: 'Backlog' },
              { columnIndex: 3, value: 'Medium' },
              { columnIndex: 4, value: 8 },
              { columnIndex: 5, value: 'Future' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    description: 'Track and resolve software bugs efficiently',
    category: 'Development',
    icon: '🐛',
    columns: [
      { name: 'Bug', type: 'text' },
      { name: 'Severity', type: 'status', settings: { labels: ['Critical', 'Major', 'Minor', 'Trivial'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Open', 'In Progress', 'Testing', 'Closed'] } },
      { name: 'Assigned To', type: 'person' },
      { name: 'Reported By', type: 'person' },
      { name: 'Reported Date', type: 'date' },
      { name: 'Resolution', type: 'text' },
    ],
    groups: [
      { 
        name: 'Critical Bugs', 
        items: [
          {
            name: 'Application crashes on login',
            columnValues: [
              { columnIndex: 1, value: 'Critical' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 5, value: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Investigating memory leak in auth service' },
            ],
          },
          {
            name: 'Data loss on save',
            columnValues: [
              { columnIndex: 1, value: 'Critical' },
              { columnIndex: 2, value: 'Open' },
              { columnIndex: 5, value: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Reported by QA team' },
            ],
          },
        ],
      },
      { 
        name: 'High Priority', 
        items: [
          {
            name: 'Slow page load times',
            columnValues: [
              { columnIndex: 1, value: 'Major' },
              { columnIndex: 2, value: 'Testing' },
              { columnIndex: 5, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Optimized database queries' },
            ],
          },
          {
            name: 'Mobile menu not responsive',
            columnValues: [
              { columnIndex: 1, value: 'Major' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 5, value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Low Priority', 
        items: [
          {
            name: 'Typography inconsistency',
            columnValues: [
              { columnIndex: 1, value: 'Minor' },
              { columnIndex: 2, value: 'Open' },
              { columnIndex: 5, value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
          {
            name: 'Icon alignment issue',
            columnValues: [
              { columnIndex: 1, value: 'Trivial' },
              { columnIndex: 2, value: 'Closed' },
              { columnIndex: 5, value: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Fixed in v2.1.3' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'feature-requests',
    name: 'Feature Requests',
    description: 'Collect and prioritize feature requests from users',
    category: 'Development',
    icon: '💡',
    columns: [
      { name: 'Feature', type: 'text' },
      { name: 'Status', type: 'status', settings: { labels: ['Submitted', 'Under Review', 'Planned', 'In Development', 'Released', 'Declined'] } },
      { name: 'Requested By', type: 'person' },
      { name: 'Votes', type: 'number' },
      { name: 'Priority', type: 'priority' },
      { name: 'Target Release', type: 'text' },
      { name: 'Impact', type: 'dropdown', settings: { options: ['High', 'Medium', 'Low'] } },
    ],
    groups: [
      { 
        name: 'New Requests', 
        items: [
          {
            name: 'Export data to CSV',
            columnValues: [
              { columnIndex: 1, value: 'Submitted' },
              { columnIndex: 3, value: 45 },
              { columnIndex: 4, value: 'High' },
              { columnIndex: 5, value: 'Q2 2024' },
              { columnIndex: 6, value: 'High' },
            ],
          },
          {
            name: 'Add keyboard shortcuts',
            columnValues: [
              { columnIndex: 1, value: 'Submitted' },
              { columnIndex: 3, value: 32 },
              { columnIndex: 4, value: 'Medium' },
              { columnIndex: 5, value: 'Q3 2024' },
              { columnIndex: 6, value: 'Medium' },
            ],
          },
        ],
      },
      { 
        name: 'Approved', 
        items: [
          {
            name: 'Bulk edit functionality',
            columnValues: [
              { columnIndex: 1, value: 'Planned' },
              { columnIndex: 3, value: 67 },
              { columnIndex: 4, value: 'High' },
              { columnIndex: 5, value: 'Q1 2024' },
              { columnIndex: 6, value: 'High' },
            ],
          },
        ],
      },
      { 
        name: 'In Progress', 
        items: [
          {
            name: 'Real-time notifications',
            columnValues: [
              { columnIndex: 1, value: 'In Development' },
              { columnIndex: 3, value: 89 },
              { columnIndex: 4, value: 'Critical' },
              { columnIndex: 5, value: 'Q1 2024' },
              { columnIndex: 6, value: 'High' },
            ],
          },
        ],
      },
    ],
  },
  
  // Product Templates
  {
    id: 'product-roadmap',
    name: 'Product Roadmap',
    description: 'Plan and track product features and releases',
    category: 'Product',
    icon: '🗺️',
    columns: [
      { name: 'Feature', type: 'text' },
      { name: 'Status', type: 'status', settings: { labels: ['Planned', 'In Development', 'Released'] } },
      { name: 'Owner', type: 'person' },
      { name: 'Priority', type: 'priority' },
      { name: 'Quarter', type: 'text' },
      { name: 'Target Date', type: 'date' },
      { name: 'Progress', type: 'number' },
    ],
    groups: [
      { 
        name: 'Q1 2024', 
        items: [
          {
            name: 'Mobile app launch',
            columnValues: [
              { columnIndex: 1, value: 'In Development' },
              { columnIndex: 3, value: 'Critical' },
              { columnIndex: 4, value: 'Q1 2024' },
              { columnIndex: 5, value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 75 },
            ],
          },
          {
            name: 'API v2 release',
            columnValues: [
              { columnIndex: 1, value: 'Planned' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: 'Q1 2024' },
              { columnIndex: 5, value: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 30 },
            ],
          },
        ],
      },
      { 
        name: 'Q2 2024', 
        items: [
          {
            name: 'Advanced analytics dashboard',
            columnValues: [
              { columnIndex: 1, value: 'Planned' },
              { columnIndex: 3, value: 'Medium' },
              { columnIndex: 4, value: 'Q2 2024' },
              { columnIndex: 5, value: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 0 },
            ],
          },
        ],
      },
      { 
        name: 'Future', 
        items: [
          {
            name: 'AI-powered recommendations',
            columnValues: [
              { columnIndex: 1, value: 'Planned' },
              { columnIndex: 3, value: 'Low' },
              { columnIndex: 4, value: 'Future' },
              { columnIndex: 6, value: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'user-research',
    name: 'User Research',
    description: 'Track user research activities and insights',
    category: 'Product',
    icon: '🔍',
    columns: [
      { name: 'Research Activity', type: 'text' },
      { name: 'Type', type: 'dropdown', settings: { options: ['Interview', 'Survey', 'Usability Test', 'Analytics Review'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Planned', 'In Progress', 'Analysis', 'Complete'] } },
      { name: 'Researcher', type: 'person' },
      { name: 'Participants', type: 'number' },
      { name: 'Date', type: 'date' },
      { name: 'Key Insights', type: 'text' },
    ],
    groups: [
      { 
        name: 'This Quarter', 
        items: [
          {
            name: 'User interview: Mobile app experience',
            columnValues: [
              { columnIndex: 1, value: 'Interview' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 4, value: 12 },
              { columnIndex: 5, value: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Users want faster navigation' },
            ],
          },
          {
            name: 'SaaS product survey',
            columnValues: [
              { columnIndex: 1, value: 'Survey' },
              { columnIndex: 2, value: 'Planned' },
              { columnIndex: 4, value: 150 },
              { columnIndex: 5, value: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Next Quarter', 
        items: [
          {
            name: 'Usability test: Checkout flow',
            columnValues: [
              { columnIndex: 1, value: 'Usability Test' },
              { columnIndex: 2, value: 'Planned' },
              { columnIndex: 4, value: 8 },
              { columnIndex: 5, value: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Completed', 
        items: [
          {
            name: 'Analytics review: Q4 metrics',
            columnValues: [
              { columnIndex: 1, value: 'Analytics Review' },
              { columnIndex: 2, value: 'Complete' },
              { columnIndex: 4, value: 0 },
              { columnIndex: 5, value: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Mobile traffic increased 40%' },
            ],
          },
        ],
      },
    ],
  },
  
  // Marketing Templates
  {
    id: 'marketing-calendar',
    name: 'Marketing Calendar',
    description: 'Plan and execute your marketing campaigns',
    category: 'Marketing',
    icon: '📅',
    columns: [
      { name: 'Campaign', type: 'text' },
      { name: 'Status', type: 'status', settings: { labels: ['Planning', 'Active', 'Completed'] } },
      { name: 'Channel', type: 'dropdown', settings: { options: ['Email', 'Social Media', 'Blog', 'Paid Ads'] } },
      { name: 'Owner', type: 'person' },
      { name: 'Start Date', type: 'date' },
      { name: 'End Date', type: 'date' },
      { name: 'Budget', type: 'number' },
    ],
    groups: [
      { 
        name: 'January', 
        items: [
          {
            name: 'New Year Product Launch',
            columnValues: [
              { columnIndex: 1, value: 'Active' },
              { columnIndex: 2, value: 'Social Media' },
              { columnIndex: 4, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 50000 },
            ],
          },
        ],
      },
      { 
        name: 'February', 
        items: [
          {
            name: 'Valentine\'s Day Campaign',
            columnValues: [
              { columnIndex: 1, value: 'Planning' },
              { columnIndex: 2, value: 'Email' },
              { columnIndex: 4, value: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 30000 },
            ],
          },
        ],
      },
      { 
        name: 'March', 
        items: [
          {
            name: 'Spring Sale Campaign',
            columnValues: [
              { columnIndex: 1, value: 'Planning' },
              { columnIndex: 2, value: 'Paid Ads' },
              { columnIndex: 4, value: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 75000 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Organize your content creation and publishing schedule',
    category: 'Marketing',
    icon: '✍️',
    columns: [
      { name: 'Title', type: 'text' },
      { name: 'Content Type', type: 'dropdown', settings: { options: ['Blog Post', 'Video', 'Podcast', 'Social Post'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Idea', 'Writing', 'Review', 'Published'] } },
      { name: 'Author', type: 'person' },
      { name: 'Publish Date', type: 'date' },
      { name: 'Platform', type: 'dropdown', settings: { options: ['Website', 'YouTube', 'Instagram', 'Twitter'] } },
      { name: 'Wordcount', type: 'number' },
    ],
    groups: [
      { 
        name: 'This Week', 
        items: [
          {
            name: '10 Tips for Better Productivity',
            columnValues: [
              { columnIndex: 1, value: 'Blog Post' },
              { columnIndex: 2, value: 'Review' },
              { columnIndex: 4, value: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'Website' },
              { columnIndex: 6, value: 1200 },
            ],
          },
        ],
      },
      { 
        name: 'Next Week', 
        items: [
          {
            name: 'Product Demo Video',
            columnValues: [
              { columnIndex: 1, value: 'Video' },
              { columnIndex: 2, value: 'Writing' },
              { columnIndex: 4, value: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'YouTube' },
            ],
          },
        ],
      },
      { 
        name: 'Future', 
        items: [
          {
            name: 'Q1 Results Podcast',
            columnValues: [
              { columnIndex: 1, value: 'Podcast' },
              { columnIndex: 2, value: 'Idea' },
              { columnIndex: 4, value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'social-media-planner',
    name: 'Social Media Planner',
    description: 'Schedule and track social media posts across platforms',
    category: 'Marketing',
    icon: '📱',
    columns: [
      { name: 'Post', type: 'text' },
      { name: 'Platform', type: 'dropdown', settings: { options: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Draft', 'Scheduled', 'Published', 'Archived'] } },
      { name: 'Author', type: 'person' },
      { name: 'Publish Date', type: 'date' },
      { name: 'Engagement', type: 'number' },
      { name: 'Link', type: 'text' },
    ],
    groups: [
      { 
        name: 'This Week', 
        items: [
          {
            name: 'Product launch announcement',
            columnValues: [
              { columnIndex: 1, value: 'LinkedIn' },
              { columnIndex: 2, value: 'Scheduled' },
              { columnIndex: 4, value: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 0 },
            ],
          },
        ],
      },
      { 
        name: 'Next Week', 
        items: [
          {
            name: 'Behind the scenes video',
            columnValues: [
              { columnIndex: 1, value: 'Instagram' },
              { columnIndex: 2, value: 'Draft' },
              { columnIndex: 4, value: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Published', 
        items: [
          {
            name: 'Team spotlight post',
            columnValues: [
              { columnIndex: 1, value: 'Twitter' },
              { columnIndex: 2, value: 'Published' },
              { columnIndex: 4, value: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 1250 },
              { columnIndex: 6, value: 'https://twitter.com/company/status/123456' },
            ],
          },
        ],
      },
    ],
  },
  
  // Sales Templates
  {
    id: 'crm',
    name: 'CRM & Sales Pipeline',
    description: 'Manage leads, contacts, and sales opportunities',
    category: 'Sales',
    icon: '💼',
    columns: [
      { name: 'Lead/Contact', type: 'text' },
      { name: 'Stage', type: 'status', settings: { labels: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] } },
      { name: 'Sales Rep', type: 'person' },
      { name: 'Deal Value', type: 'number' },
      { name: 'Close Date', type: 'date' },
      { name: 'Company', type: 'text' },
      { name: 'Priority', type: 'priority' },
    ],
    groups: [
      { 
        name: 'New Leads', 
        items: [
          {
            name: 'Acme Corporation',
            columnValues: [
              { columnIndex: 1, value: 'Lead' },
              { columnIndex: 3, value: 50000 },
              { columnIndex: 4, value: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'Acme Corp' },
              { columnIndex: 6, value: 'High' },
            ],
          },
        ],
      },
      { 
        name: 'Active Deals', 
        items: [
          {
            name: 'TechStart Inc',
            columnValues: [
              { columnIndex: 1, value: 'Negotiation' },
              { columnIndex: 3, value: 120000 },
              { columnIndex: 4, value: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'TechStart Inc' },
              { columnIndex: 6, value: 'Critical' },
            ],
          },
        ],
      },
      { 
        name: 'Closed Won', 
        items: [
          {
            name: 'Global Solutions Ltd',
            columnValues: [
              { columnIndex: 1, value: 'Won' },
              { columnIndex: 3, value: 250000 },
              { columnIndex: 4, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'Global Solutions' },
              { columnIndex: 6, value: 'High' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sales-outreach',
    name: 'Sales Outreach Tracker',
    description: 'Track outbound sales activities and follow-ups',
    category: 'Sales',
    icon: '📞',
    columns: [
      { name: 'Prospect', type: 'text' },
      { name: 'Company', type: 'text' },
      { name: 'Outreach Type', type: 'dropdown', settings: { options: ['Cold Email', 'Call', 'LinkedIn', 'Demo'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Not Contacted', 'Contacted', 'Follow-up', 'Meeting Booked', 'Closed'] } },
      { name: 'Sales Rep', type: 'person' },
      { name: 'Last Contact', type: 'date' },
      { name: 'Next Follow-up', type: 'date' },
      { name: 'Notes', type: 'text' },
    ],
    groups: [
      { 
        name: 'This Week', 
        items: [
          {
            name: 'John Smith - Enterprise Demo',
            columnValues: [
              { columnIndex: 1, value: 'TechCorp' },
              { columnIndex: 2, value: 'Demo' },
              { columnIndex: 3, value: 'Meeting Booked' },
              { columnIndex: 5, value: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'Interested in enterprise features' },
            ],
          },
        ],
      },
      { 
        name: 'Next Week', 
        items: [
          {
            name: 'Sarah Johnson - Cold Email',
            columnValues: [
              { columnIndex: 1, value: 'InnovateCo' },
              { columnIndex: 2, value: 'Cold Email' },
              { columnIndex: 3, value: 'Contacted' },
              { columnIndex: 5, value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Follow-ups', 
        items: [
          {
            name: 'Mike Davis - LinkedIn Connection',
            columnValues: [
              { columnIndex: 1, value: 'StartupXYZ' },
              { columnIndex: 2, value: 'LinkedIn' },
              { columnIndex: 3, value: 'Follow-up' },
              { columnIndex: 5, value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'Needs pricing information' },
            ],
          },
        ],
      },
    ],
  },
  
  // Project Management Templates
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Plan, track, and deliver projects on time',
    category: 'Project Management',
    icon: '📊',
    columns: [
      { name: 'Task', type: 'text' },
      { name: 'Status', type: 'status', settings: { labels: ['Not Started', 'In Progress', 'Blocked', 'Completed'] } },
      { name: 'Assignee', type: 'person' },
      { name: 'Priority', type: 'priority' },
      { name: 'Start Date', type: 'date' },
      { name: 'Due Date', type: 'date' },
      { name: 'Progress', type: 'number' },
      { name: 'Dependencies', type: 'text' },
    ],
    groups: [
      { 
        name: 'Phase 1 - Planning', 
        items: [
          {
            name: 'Define project scope',
            columnValues: [
              { columnIndex: 1, value: 'Completed' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 100 },
            ],
          },
        ],
      },
      { 
        name: 'Phase 2 - Execution', 
        items: [
          {
            name: 'Develop core features',
            columnValues: [
              { columnIndex: 1, value: 'In Progress' },
              { columnIndex: 3, value: 'Critical' },
              { columnIndex: 4, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 45 },
            ],
          },
        ],
      },
      { 
        name: 'Phase 3 - Review', 
        items: [
          {
            name: 'User acceptance testing',
            columnValues: [
              { columnIndex: 1, value: 'Not Started' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kanban-board',
    name: 'Kanban Board',
    description: 'Simple kanban workflow for any team or project',
    category: 'Project Management',
    icon: '📋',
    columns: [
      { name: 'Task', type: 'text' },
      { name: 'Status', type: 'status', settings: { labels: ['To Do', 'In Progress', 'Review', 'Done'] } },
      { name: 'Assignee', type: 'person' },
      { name: 'Priority', type: 'priority' },
      { name: 'Due Date', type: 'date' },
      { name: 'Labels', type: 'text' },
    ],
    groups: [
      { 
        name: 'To Do', 
        items: [
          {
            name: 'Update documentation',
            columnValues: [
              { columnIndex: 1, value: 'To Do' },
              { columnIndex: 3, value: 'Medium' },
              { columnIndex: 4, value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'In Progress', 
        items: [
          {
            name: 'Refactor authentication module',
            columnValues: [
              { columnIndex: 1, value: 'In Progress' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Done', 
        items: [
          {
            name: 'Fix login bug',
            columnValues: [
              { columnIndex: 1, value: 'Done' },
              { columnIndex: 3, value: 'Critical' },
              { columnIndex: 4, value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'resource-management',
    name: 'Resource Management',
    description: 'Allocate and track team resources across projects',
    category: 'Project Management',
    icon: '👥',
    columns: [
      { name: 'Resource', type: 'person' },
      { name: 'Project', type: 'text' },
      { name: 'Role', type: 'text' },
      { name: 'Allocation %', type: 'number' },
      { name: 'Start Date', type: 'date' },
      { name: 'End Date', type: 'date' },
      { name: 'Status', type: 'status', settings: { labels: ['Available', 'Allocated', 'Overbooked'] } },
      { name: 'Skills', type: 'text' },
    ],
    groups: [
      { 
        name: 'Current Projects', 
        items: [
          {
            name: 'Alice Johnson',
            columnValues: [
              { columnIndex: 1, value: 'Mobile App Redesign' },
              { columnIndex: 2, value: 'UI/UX Designer' },
              { columnIndex: 3, value: 100 },
              { columnIndex: 4, value: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Allocated' },
              { columnIndex: 7, value: 'Figma, Sketch, Prototyping' },
            ],
          },
        ],
      },
      { 
        name: 'Upcoming', 
        items: [
          {
            name: 'Bob Smith',
            columnValues: [
              { columnIndex: 1, value: 'API Integration' },
              { columnIndex: 2, value: 'Backend Developer' },
              { columnIndex: 3, value: 0 },
              { columnIndex: 4, value: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Available' },
              { columnIndex: 7, value: 'Node.js, Python, REST APIs' },
            ],
          },
        ],
      },
      { 
        name: 'Available', 
        items: [
          {
            name: 'Carol White',
            columnValues: [
              { columnIndex: 1, value: 'N/A' },
              { columnIndex: 2, value: 'Frontend Developer' },
              { columnIndex: 3, value: 0 },
              { columnIndex: 6, value: 'Available' },
              { columnIndex: 7, value: 'React, TypeScript, CSS' },
            ],
          },
        ],
      },
    ],
  },
  
  // Operations Templates
  {
    id: 'event-planning',
    name: 'Event Planning',
    description: 'Organize events from start to finish',
    category: 'Operations',
    icon: '🎉',
    columns: [
      { name: 'Task', type: 'text' },
      { name: 'Status', type: 'status', settings: { labels: ['To Do', 'In Progress', 'Done'] } },
      { name: 'Owner', type: 'person' },
      { name: 'Category', type: 'dropdown', settings: { options: ['Venue', 'Catering', 'Marketing', 'Logistics', 'Tech'] } },
      { name: 'Due Date', type: 'date' },
      { name: 'Budget', type: 'number' },
      { name: 'Notes', type: 'text' },
    ],
    groups: [
      { 
        name: 'Pre-Event', 
        items: [
          {
            name: 'Book venue',
            columnValues: [
              { columnIndex: 1, value: 'Done' },
              { columnIndex: 3, value: 'Venue' },
              { columnIndex: 4, value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 15000 },
              { columnIndex: 6, value: 'Convention Center booked' },
            ],
          },
          {
            name: 'Send invitations',
            columnValues: [
              { columnIndex: 1, value: 'In Progress' },
              { columnIndex: 3, value: 'Marketing' },
              { columnIndex: 4, value: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Event Day', 
        items: [
          {
            name: 'Setup registration desk',
            columnValues: [
              { columnIndex: 1, value: 'To Do' },
              { columnIndex: 3, value: 'Logistics' },
              { columnIndex: 4, value: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Post-Event', 
        items: [
          {
            name: 'Send thank you emails',
            columnValues: [
              { columnIndex: 1, value: 'To Do' },
              { columnIndex: 3, value: 'Marketing' },
              { columnIndex: 4, value: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management',
    description: 'Track inventory levels and orders',
    category: 'Operations',
    icon: '📦',
    columns: [
      { name: 'Item', type: 'text' },
      { name: 'SKU', type: 'text' },
      { name: 'Quantity', type: 'number' },
      { name: 'Status', type: 'status', settings: { labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Ordered'] } },
      { name: 'Reorder Point', type: 'number' },
      { name: 'Supplier', type: 'text' },
      { name: 'Last Updated', type: 'date' },
      { name: 'Location', type: 'text' },
    ],
    groups: [
      { 
        name: 'In Stock', 
        items: [
          {
            name: 'Laptop - Dell XPS 15',
            columnValues: [
              { columnIndex: 1, value: 'LAP-DELL-XPS15' },
              { columnIndex: 2, value: 25 },
              { columnIndex: 3, value: 'In Stock' },
              { columnIndex: 4, value: 5 },
              { columnIndex: 5, value: 'Dell Inc' },
              { columnIndex: 6, value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'Warehouse A' },
            ],
          },
        ],
      },
      { 
        name: 'Low Stock', 
        items: [
          {
            name: 'Monitor - LG 27" 4K',
            columnValues: [
              { columnIndex: 1, value: 'MON-LG-27-4K' },
              { columnIndex: 2, value: 3 },
              { columnIndex: 3, value: 'Low Stock' },
              { columnIndex: 4, value: 10 },
              { columnIndex: 5, value: 'LG Electronics' },
              { columnIndex: 6, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'Warehouse B' },
            ],
          },
        ],
      },
      { 
        name: 'On Order', 
        items: [
          {
            name: 'Keyboard - Mechanical RGB',
            columnValues: [
              { columnIndex: 1, value: 'KEY-MECH-RGB' },
              { columnIndex: 2, value: 0 },
              { columnIndex: 3, value: 'Ordered' },
              { columnIndex: 4, value: 15 },
              { columnIndex: 5, value: 'Corsair' },
              { columnIndex: 6, value: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
    ],
  },
  
  // HR Templates
  {
    id: 'hiring-pipeline',
    name: 'Hiring Pipeline',
    description: 'Track candidates through the recruitment process',
    category: 'HR',
    icon: '🎯',
    columns: [
      { name: 'Candidate', type: 'text' },
      { name: 'Position', type: 'text' },
      { name: 'Stage', type: 'status', settings: { labels: ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'] } },
      { name: 'Recruiter', type: 'person' },
      { name: 'Applied Date', type: 'date' },
      { name: 'Next Step', type: 'date' },
      { name: 'Rating', type: 'number' },
      { name: 'Source', type: 'text' },
    ],
    groups: [
      { 
        name: 'New Applicants', 
        items: [
          {
            name: 'Jane Doe',
            columnValues: [
              { columnIndex: 1, value: 'Senior Developer' },
              { columnIndex: 2, value: 'Applied' },
              { columnIndex: 4, value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 0 },
              { columnIndex: 7, value: 'LinkedIn' },
            ],
          },
        ],
      },
      { 
        name: 'In Progress', 
        items: [
          {
            name: 'John Smith',
            columnValues: [
              { columnIndex: 1, value: 'Product Manager' },
              { columnIndex: 2, value: 'Interview' },
              { columnIndex: 4, value: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 8 },
              { columnIndex: 7, value: 'Company Website' },
            ],
          },
        ],
      },
      { 
        name: 'Offers', 
        items: [
          {
            name: 'Sarah Johnson',
            columnValues: [
              { columnIndex: 1, value: 'UX Designer' },
              { columnIndex: 2, value: 'Offer' },
              { columnIndex: 4, value: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 9 },
              { columnIndex: 7, value: 'Referral' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'Streamline new employee onboarding process',
    category: 'HR',
    icon: '👋',
    columns: [
      { name: 'Task', type: 'text' },
      { name: 'Employee', type: 'person' },
      { name: 'Status', type: 'status', settings: { labels: ['Not Started', 'In Progress', 'Completed'] } },
      { name: 'Owner', type: 'person' },
      { name: 'Department', type: 'text' },
      { name: 'Due Date', type: 'date' },
      { name: 'Priority', type: 'priority' },
    ],
    groups: [
      { 
        name: 'Pre-Start', 
        items: [
          {
            name: 'Complete paperwork',
            columnValues: [
              { columnIndex: 1, value: 'Completed' },
              { columnIndex: 2, value: 'HR' },
              { columnIndex: 4, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'High' },
            ],
          },
        ],
      },
      { 
        name: 'Week 1', 
        items: [
          {
            name: 'Setup workstation',
            columnValues: [
              { columnIndex: 1, value: 'In Progress' },
              { columnIndex: 2, value: 'IT' },
              { columnIndex: 4, value: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Critical' },
            ],
          },
        ],
      },
      { 
        name: 'Month 1', 
        items: [
          {
            name: '30-day review meeting',
            columnValues: [
              { columnIndex: 1, value: 'Not Started' },
              { columnIndex: 2, value: 'Manager' },
              { columnIndex: 4, value: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 'Medium' },
            ],
          },
        ],
      },
    ],
  },
  
  // Design Templates
  {
    id: 'design-requests',
    name: 'Design Requests',
    description: 'Manage design requests and track progress',
    category: 'Design',
    icon: '🎨',
    columns: [
      { name: 'Request', type: 'text' },
      { name: 'Type', type: 'dropdown', settings: { options: ['UI/UX', 'Graphics', 'Illustration', 'Branding', 'Video'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Requested', 'In Review', 'In Progress', 'Review', 'Approved', 'Delivered'] } },
      { name: 'Designer', type: 'person' },
      { name: 'Requester', type: 'person' },
      { name: 'Priority', type: 'priority' },
      { name: 'Due Date', type: 'date' },
      { name: 'Link', type: 'text' },
    ],
    groups: [
      { 
        name: 'New Requests', 
        items: [
          {
            name: 'Redesign login page',
            columnValues: [
              { columnIndex: 1, value: 'UI/UX' },
              { columnIndex: 2, value: 'Requested' },
              { columnIndex: 5, value: 'High' },
              { columnIndex: 6, value: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'In Progress', 
        items: [
          {
            name: 'Create product icons set',
            columnValues: [
              { columnIndex: 1, value: 'Graphics' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 5, value: 'Medium' },
              { columnIndex: 6, value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Completed', 
        items: [
          {
            name: 'Company logo refresh',
            columnValues: [
              { columnIndex: 1, value: 'Branding' },
              { columnIndex: 2, value: 'Delivered' },
              { columnIndex: 5, value: 'High' },
              { columnIndex: 6, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'https://design.company.com/logo' },
            ],
          },
        ],
      },
    ],
  },
  
  // Personal Templates
  {
    id: 'personal-goals',
    name: 'Personal Goals & Habits',
    description: 'Track personal goals, habits, and self-improvement',
    category: 'Personal',
    icon: '⭐',
    columns: [
      { name: 'Goal/Habit', type: 'text' },
      { name: 'Category', type: 'dropdown', settings: { options: ['Health', 'Career', 'Finance', 'Learning', 'Relationships'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Not Started', 'In Progress', 'Completed', 'On Hold'] } },
      { name: 'Target Date', type: 'date' },
      { name: 'Progress %', type: 'number' },
      { name: 'Notes', type: 'text' },
    ],
    groups: [
      { 
        name: 'This Quarter', 
        items: [
          {
            name: 'Learn TypeScript',
            columnValues: [
              { columnIndex: 1, value: 'Learning' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 3, value: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 4, value: 60 },
              { columnIndex: 5, value: 'Completed online course, working on projects' },
            ],
          },
        ],
      },
      { 
        name: 'This Year', 
        items: [
          {
            name: 'Run a marathon',
            columnValues: [
              { columnIndex: 1, value: 'Health' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 3, value: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 4, value: 30 },
              { columnIndex: 5, value: 'Training 3x per week' },
            ],
          },
        ],
      },
      { 
        name: 'Long Term', 
        items: [
          {
            name: 'Buy a house',
            columnValues: [
              { columnIndex: 1, value: 'Finance' },
              { columnIndex: 2, value: 'Not Started' },
              { columnIndex: 3, value: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 4, value: 15 },
              { columnIndex: 5, value: 'Saving for down payment' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    description: 'Organize your weekly tasks and priorities',
    category: 'Personal',
    icon: '📅',
    columns: [
      { name: 'Task', type: 'text' },
      { name: 'Category', type: 'dropdown', settings: { options: ['Work', 'Personal', 'Fitness', 'Learning', 'Social'] } },
      { name: 'Status', type: 'status', settings: { labels: ['To Do', 'In Progress', 'Done'] } },
      { name: 'Priority', type: 'priority' },
      { name: 'Time Required', type: 'text' },
      { name: 'Due', type: 'date' },
    ],
    groups: [
      { 
        name: 'Monday', 
        items: [
          {
            name: 'Team standup meeting',
            columnValues: [
              { columnIndex: 1, value: 'Work' },
              { columnIndex: 2, value: 'Done' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: '30 min' },
              { columnIndex: 5, value: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Tuesday', 
        items: [
          {
            name: 'Gym workout',
            columnValues: [
              { columnIndex: 1, value: 'Fitness' },
              { columnIndex: 2, value: 'To Do' },
              { columnIndex: 3, value: 'Medium' },
              { columnIndex: 4, value: '1 hour' },
            ],
          },
        ],
      },
      { 
        name: 'Wednesday', 
        items: [
          {
            name: 'Code review session',
            columnValues: [
              { columnIndex: 1, value: 'Work' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: '2 hours' },
            ],
          },
        ],
      },
      { 
        name: 'Thursday', 
        items: [
          {
            name: 'Read technical book chapter',
            columnValues: [
              { columnIndex: 1, value: 'Learning' },
              { columnIndex: 2, value: 'To Do' },
              { columnIndex: 3, value: 'Low' },
              { columnIndex: 4, value: '45 min' },
            ],
          },
        ],
      },
      { 
        name: 'Friday', 
        items: [
          {
            name: 'Weekly planning',
            columnValues: [
              { columnIndex: 1, value: 'Work' },
              { columnIndex: 2, value: 'To Do' },
              { columnIndex: 3, value: 'High' },
              { columnIndex: 4, value: '1 hour' },
            ],
          },
        ],
      },
      { 
        name: 'Weekend', 
        items: [
          {
            name: 'Family dinner',
            columnValues: [
              { columnIndex: 1, value: 'Social' },
              { columnIndex: 2, value: 'To Do' },
              { columnIndex: 3, value: 'Medium' },
              { columnIndex: 4, value: '2 hours' },
            ],
          },
        ],
      },
    ],
  },
  
  // Penetration Testing Templates
  {
    id: 'vulnerability-assessment',
    name: 'Vulnerability Assessment',
    description: 'Track and manage security vulnerabilities found during assessments',
    category: 'Penetration Testing',
    icon: '🔒',
    columns: [
      { name: 'Vulnerability', type: 'text' },
      { name: 'Severity', type: 'status', settings: { labels: ['Critical', 'High', 'Medium', 'Low', 'Info'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Open', 'In Progress', 'Fixed', 'Verified', 'Closed'] } },
      { name: 'Tester', type: 'person' },
      { name: 'CVSS Score', type: 'number' },
      { name: 'Affected System', type: 'text' },
      { name: 'Discovered Date', type: 'date' },
      { name: 'Remediation Notes', type: 'text' },
    ],
    groups: [
      { 
        name: 'Critical', 
        items: [
          {
            name: 'SQL Injection in login endpoint',
            columnValues: [
              { columnIndex: 1, value: 'Critical' },
              { columnIndex: 2, value: 'Open' },
              { columnIndex: 4, value: 9.8 },
              { columnIndex: 5, value: 'Web Application - /api/auth/login' },
              { columnIndex: 6, value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'Requires parameterized queries' },
            ],
          },
        ],
      },
      { 
        name: 'High Priority', 
        items: [
          {
            name: 'Missing security headers',
            columnValues: [
              { columnIndex: 1, value: 'High' },
              { columnIndex: 2, value: 'In Progress' },
              { columnIndex: 4, value: 7.2 },
              { columnIndex: 5, value: 'Web Application - All endpoints' },
              { columnIndex: 6, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'Add CSP, HSTS, X-Frame-Options headers' },
            ],
          },
        ],
      },
      { 
        name: 'Medium/Low', 
        items: [
          {
            name: 'Weak password policy',
            columnValues: [
              { columnIndex: 1, value: 'Medium' },
              { columnIndex: 2, value: 'Fixed' },
              { columnIndex: 4, value: 5.3 },
              { columnIndex: 5, value: 'Authentication System' },
              { columnIndex: 6, value: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 7, value: 'Updated password requirements' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'penetration-test',
    name: 'Penetration Test',
    description: 'Manage penetration testing engagements and findings',
    category: 'Penetration Testing',
    icon: '🛡️',
    columns: [
      { name: 'Test Target', type: 'text' },
      { name: 'Test Type', type: 'dropdown', settings: { options: ['Web App', 'Network', 'Mobile', 'API', 'Cloud', 'Social Engineering'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Scheduled', 'Reconnaissance', 'Scanning', 'Exploitation', 'Reporting', 'Complete'] } },
      { name: 'Tester', type: 'person' },
      { name: 'Start Date', type: 'date' },
      { name: 'End Date', type: 'date' },
      { name: 'Findings Count', type: 'number' },
      { name: 'Report Link', type: 'text' },
    ],
    groups: [
      { 
        name: 'Active Tests', 
        items: [
          {
            name: 'E-commerce Platform Assessment',
            columnValues: [
              { columnIndex: 1, value: 'Web App' },
              { columnIndex: 2, value: 'Exploitation' },
              { columnIndex: 4, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 12 },
            ],
          },
        ],
      },
      { 
        name: 'Scheduled', 
        items: [
          {
            name: 'Mobile App Security Review',
            columnValues: [
              { columnIndex: 1, value: 'Mobile' },
              { columnIndex: 2, value: 'Scheduled' },
              { columnIndex: 4, value: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
            ],
          },
        ],
      },
      { 
        name: 'Completed', 
        items: [
          {
            name: 'API Security Assessment',
            columnValues: [
              { columnIndex: 1, value: 'API' },
              { columnIndex: 2, value: 'Complete' },
              { columnIndex: 4, value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 6, value: 8 },
              { columnIndex: 7, value: 'https://reports.company.com/api-test-2024' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'Track security audit activities and compliance checks',
    category: 'Penetration Testing',
    icon: '🔍',
    columns: [
      { name: 'Audit Item', type: 'text' },
      { name: 'Category', type: 'dropdown', settings: { options: ['Access Control', 'Encryption', 'Network Security', 'Data Protection', 'Compliance', 'Incident Response'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Pending', 'In Review', 'Passed', 'Failed', 'Remediated'] } },
      { name: 'Auditor', type: 'person' },
      { name: 'Audit Date', type: 'date' },
      { name: 'Risk Level', type: 'status', settings: { labels: ['Critical', 'High', 'Medium', 'Low'] } },
      { name: 'Compliance Standard', type: 'text' },
      { name: 'Notes', type: 'text' },
    ],
    groups: [
      { 
        name: 'In Progress', 
        items: [
          {
            name: 'Access control review',
            columnValues: [
              { columnIndex: 1, value: 'Access Control' },
              { columnIndex: 2, value: 'In Review' },
              { columnIndex: 4, value: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'High' },
              { columnIndex: 6, value: 'ISO 27001' },
              { columnIndex: 7, value: 'Reviewing RBAC implementation' },
            ],
          },
        ],
      },
      { 
        name: 'Passed', 
        items: [
          {
            name: 'Encryption at rest verification',
            columnValues: [
              { columnIndex: 1, value: 'Encryption' },
              { columnIndex: 2, value: 'Passed' },
              { columnIndex: 4, value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'Low' },
              { columnIndex: 6, value: 'PCI DSS' },
            ],
          },
        ],
      },
      { 
        name: 'Failed - Needs Remediation', 
        items: [
          {
            name: 'Network segmentation check',
            columnValues: [
              { columnIndex: 1, value: 'Network Security' },
              { columnIndex: 2, value: 'Failed' },
              { columnIndex: 4, value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 'Critical' },
              { columnIndex: 6, value: 'SOC 2' },
              { columnIndex: 7, value: 'Production and staging networks not properly segmented' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bug-bounty',
    name: 'Bug Bounty Program',
    description: 'Manage bug bounty submissions and rewards',
    category: 'Penetration Testing',
    icon: '💰',
    columns: [
      { name: 'Submission', type: 'text' },
      { name: 'Severity', type: 'status', settings: { labels: ['Critical', 'High', 'Medium', 'Low'] } },
      { name: 'Status', type: 'status', settings: { labels: ['Submitted', 'Triaged', 'Valid', 'Invalid', 'Duplicate', 'Resolved', 'Rewarded'] } },
      { name: 'Researcher', type: 'text' },
      { name: 'Submitted Date', type: 'date' },
      { name: 'Reward Amount', type: 'number' },
      { name: 'Affected Component', type: 'text' },
      { name: 'Notes', type: 'text' },
    ],
    groups: [
      { 
        name: 'New Submissions', 
        items: [
          {
            name: 'XSS vulnerability in search',
            columnValues: [
              { columnIndex: 1, value: 'High' },
              { columnIndex: 2, value: 'Triaged' },
              { columnIndex: 4, value: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 0 },
              { columnIndex: 6, value: 'Search Functionality' },
              { columnIndex: 7, value: 'Under review by security team' },
            ],
          },
        ],
      },
      { 
        name: 'Valid - Pending Reward', 
        items: [
          {
            name: 'IDOR in user profile endpoint',
            columnValues: [
              { columnIndex: 1, value: 'Medium' },
              { columnIndex: 2, value: 'Valid' },
              { columnIndex: 4, value: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 500 },
              { columnIndex: 6, value: 'User API' },
            ],
          },
        ],
      },
      { 
        name: 'Rewarded', 
        items: [
          {
            name: 'CSRF token missing',
            columnValues: [
              { columnIndex: 1, value: 'High' },
              { columnIndex: 2, value: 'Rewarded' },
              { columnIndex: 4, value: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
              { columnIndex: 5, value: 1000 },
              { columnIndex: 6, value: 'Authentication System' },
              { columnIndex: 7, value: 'Reward paid via HackerOne' },
            ],
          },
        ],
      },
    ],
  },
];
