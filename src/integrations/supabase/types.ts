export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendees: {
        Row: {
          comped: boolean
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["attendee_status"]
          user_id: string
        }
        Insert: {
          comped?: boolean
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["attendee_status"]
          user_id: string
        }
        Update: {
          comped?: boolean
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["attendee_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      birthday_cards: {
        Row: {
          background_image_url: string | null
          birthday_date: string
          color: string
          created_at: string
          emoji: string
          id: string
          message: string | null
          opened_at: string | null
          recipient_id: string
          sender_id: string
          text_box_color: string | null
          text_box_enabled: boolean
          text_box_style: string
          text_position: Json | null
        }
        Insert: {
          background_image_url?: string | null
          birthday_date: string
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          message?: string | null
          opened_at?: string | null
          recipient_id: string
          sender_id: string
          text_box_color?: string | null
          text_box_enabled?: boolean
          text_box_style?: string
          text_position?: Json | null
        }
        Update: {
          background_image_url?: string | null
          birthday_date?: string
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          message?: string | null
          opened_at?: string | null
          recipient_id?: string
          sender_id?: string
          text_box_color?: string | null
          text_box_enabled?: boolean
          text_box_style?: string
          text_position?: Json | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bring_item_claims: {
        Row: {
          created_at: string
          event_id: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bring_item_claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "event_bring_items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bring_items: {
        Row: {
          claimed_by: string | null
          created_at: string
          created_by: string
          event_id: string
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_cohost_requests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string | null
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message?: string | null
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cohost_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_collaborators: {
        Row: {
          added_by: string
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_exit_poll_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_exit_poll_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string
          currency: string
          description: string
          event_id: string
          id: string
          payer_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by: string
          currency?: string
          description: string
          event_id: string
          id?: string
          payer_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          event_id?: string
          id?: string
          payer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invite_suggestions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          suggested_user_id: string
          suggester_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          suggested_user_id: string
          suggester_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          suggested_user_id?: string
          suggester_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invite_suggestions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invitee_id: string
          inviter_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invitee_id: string
          inviter_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_knocks: {
        Row: {
          created_at: string
          event_id: string
          id: string
          knocker_id: string
          status: Database["public"]["Enums"]["knock_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          knocker_id: string
          status?: Database["public"]["Enums"]["knock_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          knocker_id?: string
          status?: Database["public"]["Enums"]["knock_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_knocks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_line_sessions: {
        Row: {
          ended_at: string | null
          event_id: string
          id: string
          started_at: string
          started_by: string
        }
        Insert: {
          ended_at?: string | null
          event_id: string
          id?: string
          started_at?: string
          started_by: string
        }
        Update: {
          ended_at?: string | null
          event_id?: string
          id?: string
          started_at?: string
          started_by?: string
        }
        Relationships: []
      }
      event_line_status: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          note: string | null
          session_id: string
          status: Database["public"]["Enums"]["line_status"]
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          note?: string | null
          session_id: string
          status: Database["public"]["Enums"]["line_status"]
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          note?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["line_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_line_status_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_line_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_line_votes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["line_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status: Database["public"]["Enums"]["line_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["line_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_pacts: {
        Row: {
          created_at: string
          event_id: string
          id: string
          partner_id: string
          proposer_id: string
          sealed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          partner_id: string
          proposer_id: string
          sealed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          partner_id?: string
          proposer_id?: string
          sealed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_perks: {
        Row: {
          created_at: string
          event_id: string
          id: string
          offer_key: string
          recipient_id: string
          sent_by: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          offer_key: string
          recipient_id: string
          sent_by: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          offer_key?: string
          recipient_id?: string
          sent_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_perks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_pulse_votes: {
        Row: {
          created_at: string
          id: string
          pulse_id: string
          user_id: string
          vote: string
        }
        Insert: {
          created_at?: string
          id?: string
          pulse_id: string
          user_id: string
          vote: string
        }
        Update: {
          created_at?: string
          id?: string
          pulse_id?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_pulse_votes_pulse_id_fkey"
            columns: ["pulse_id"]
            isOneToOne: false
            referencedRelation: "event_pulses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_pulses: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string
          id: string
          question: string
          started_by: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at?: string
          id?: string
          question?: string
          started_by: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          question?: string
          started_by?: string
        }
        Relationships: []
      }
      event_ratings: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rating: Database["public"]["Enums"]["event_rating"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rating: Database["public"]["Enums"]["event_rating"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rating?: Database["public"]["Enums"]["event_rating"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_reactions: {
        Row: {
          created_at: string
          emoji: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          bring_list_enabled: boolean
          capacity: number | null
          capsule_dismissed_at: string | null
          city: string | null
          created_at: string
          created_by: string
          date: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          location: string | null
          name: string
          source_url: string | null
          ticket_currency: string
          ticket_price_cents: number | null
          ticket_quantity: number | null
          time: string | null
          updated_at: string
          vibe_category: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          bring_list_enabled?: boolean
          capacity?: number | null
          capsule_dismissed_at?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          date?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          name: string
          source_url?: string | null
          ticket_currency?: string
          ticket_price_cents?: number | null
          ticket_quantity?: number | null
          time?: string | null
          updated_at?: string
          vibe_category?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          bring_list_enabled?: boolean
          capacity?: number | null
          capsule_dismissed_at?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          date?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          source_url?: string | null
          ticket_currency?: string
          ticket_price_cents?: number | null
          ticket_quantity?: number | null
          time?: string | null
          updated_at?: string
          vibe_category?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: []
      }
      expense_shares: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          settled_at: string | null
          share_cents: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          settled_at?: string | null
          share_cents: number
          user_id: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          settled_at?: string | null
          share_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "event_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["friend_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      live_presence: {
        Row: {
          event_id: string
          expires_at: string
          id: string
          lat: number | null
          lng: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          expires_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          expires_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          comment_id: string | null
          content: string | null
          created_at: string
          event_id: string | null
          id: string
          read: boolean
          recipient_id: string
          sender_id: string | null
          type: string
        }
        Insert: {
          comment_id?: string | null
          content?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          read?: boolean
          recipient_id: string
          sender_id?: string | null
          type: string
        }
        Update: {
          comment_id?: string | null
          content?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string | null
          type?: string
        }
        Relationships: []
      }
      organizer_applications: {
        Row: {
          created_at: string
          id: string
          instagram: string | null
          reviewed_at: string | null
          status: string
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instagram?: string | null
          reviewed_at?: string | null
          status?: string
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instagram?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profile_highlights: {
        Row: {
          created_at: string
          event_id: string
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          organizer_instagram: string | null
          organizer_verified: boolean
          organizer_website: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organizer_instagram?: string | null
          organizer_verified?: boolean
          organizer_website?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organizer_instagram?: string | null
          organizer_verified?: boolean
          organizer_website?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      stripe_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          amount_cents: number
          buyer_id: string
          checked_in_at: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          qr_token: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          checked_in_at?: string | null
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          qr_token?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          checked_in_at?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          qr_token?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      time_capsule_messages: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_capsule_photos: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_capsule_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_birthdays: {
        Row: {
          birthday: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_payment_handles: {
        Row: {
          n26_handle: string | null
          paypal_handle: string | null
          revolut_handle: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          n26_handle?: string | null
          paypal_handle?: string | null
          revolut_handle?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          n26_handle?: string | null
          paypal_handle?: string | null
          revolut_handle?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          active_mode: Database["public"]["Enums"]["account_type"]
          coach_seen: boolean
          created_at: string
          language: string | null
          onboarded: boolean
          show_dna_badge: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active_mode?: Database["public"]["Enums"]["account_type"]
          coach_seen?: boolean
          created_at?: string
          language?: string | null
          onboarded?: boolean
          show_dna_badge?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active_mode?: Database["public"]["Enums"]["account_type"]
          coach_seen?: boolean
          created_at?: string
          language?: string | null
          onboarded?: boolean
          show_dna_badge?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_statuses: {
        Row: {
          created_at: string
          expires_at: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      creator_scores: {
        Row: {
          events_rated: number | null
          fire_count: number | null
          fire_pct: number | null
          total_ratings: number | null
          user_id: string | null
        }
        Relationships: []
      }
      event_score_summary: {
        Row: {
          event_id: string | null
          fire_count: number | null
          fire_pct: number | null
          flop_count: number | null
          mid_count: number | null
          total_ratings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_mutual_friends: { Args: { _a: string; _b: string }; Returns: boolean }
      can_view_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_empty_capsules: { Args: never; Returns: undefined }
      event_has_ended: { Args: { _event_id: string }; Returns: boolean }
      get_event_preview: { Args: { _event_id: string }; Returns: Json }
      get_event_pulse_stats: {
        Args: { _event_id: string }
        Returns: {
          avg_score: number
          fire_count: number
          flop_count: number
          mid_count: number
          total_ratings: number
        }[]
      }
      get_event_rsvp_timeline: {
        Args: { _event_id: string }
        Returns: {
          confirms: number
          day: string
        }[]
      }
      get_event_visibility_hint: {
        Args: { _event_id: string }
        Returns: {
          avatar_url: string
          creator_id: string
          display_name: string
          event_name: string
          username: string
          visibility: string
        }[]
      }
      get_exit_poll_comments: {
        Args: { _event_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
        }[]
      }
      get_friend_birthdays: {
        Args: never
        Returns: {
          avatar_url: string
          birthday: string
          display_name: string
          user_id: string
        }[]
      }
      get_profile_highlights: {
        Args: { _profile_user_id: string }
        Returns: {
          event_date: string
          event_description: string
          event_id: string
          event_image_url: string
          event_name: string
          highlight_id: string
          photo_id: string
          photo_url: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_rsvp_going: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_attendee: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_collaborator: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_invitee: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_owner: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      set_account_mode: {
        Args: { _mode: Database["public"]["Enums"]["account_type"] }
        Returns: Database["public"]["Enums"]["account_type"]
      }
    }
    Enums: {
      account_type: "person" | "organizer"
      app_role: "admin" | "moderator" | "user"
      attendee_status: "interested" | "going"
      event_rating: "fire" | "mid" | "flop"
      event_visibility: "public" | "tentative" | "private" | "circle"
      friend_request_status: "pending" | "accepted" | "declined"
      knock_status: "pending" | "revealed" | "ignored"
      line_status: "walk_in" | "short_wait" | "long_wait" | "closed"
      user_status: "available" | "not_tonight" | "travelling" | "low_energy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["person", "organizer"],
      app_role: ["admin", "moderator", "user"],
      attendee_status: ["interested", "going"],
      event_rating: ["fire", "mid", "flop"],
      event_visibility: ["public", "tentative", "private", "circle"],
      friend_request_status: ["pending", "accepted", "declined"],
      knock_status: ["pending", "revealed", "ignored"],
      line_status: ["walk_in", "short_wait", "long_wait", "closed"],
      user_status: ["available", "not_tonight", "travelling", "low_energy"],
    },
  },
} as const
