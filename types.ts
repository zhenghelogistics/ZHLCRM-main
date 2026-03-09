export enum LeadStatus {
    QUOTE_SENT = "Quote Sent",
    IN_DISCUSSION = "In Discussion",
    WON = "Won",
    LOST_GHOSTED = "LOST: GHOSTED",
    LOST_REJECTED = "Lost (Rejected)",
}

export enum RiskLevel {
    LOW = "Low",
    MEDIUM = "Medium",
    HIGH = "High",
}

export interface Lead {
    id: string;
    customer_name: string;
    customer_email?: string;
    quoted_price: number;
    industry: string;
    lead_score: number;
    status: LeadStatus;
    stage: string;
    createdAt: string;
    next_follow_up: string;
    riskLevel: RiskLevel;
    notes?: string;
    respondedAtStage?: string | null;
}

export interface MonthlyArchive {
    id: string; // e.g., "2024-12"
    displayName: string; // e.g., "December 2024"
    leads: Lead[];
}
