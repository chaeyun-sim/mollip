export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '14.5';
	};
	public: {
		Tables: {
			audio_guides: {
				Row: {
					artist: string | null;
					created_at: string;
					full_text: string;
					id: string;
					image_url: string | null;
					title: string;
					user_id: string;
				};
				Insert: {
					artist?: string | null;
					created_at?: string;
					full_text?: string;
					id?: string;
					image_url?: string | null;
					title: string;
					user_id: string;
				};
				Update: {
					artist?: string | null;
					created_at?: string;
					full_text?: string;
					id?: string;
					image_url?: string | null;
					title?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'audio_guides_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			account_deletion_feedback: {
				Row: {
					created_at: string;
					detail: string | null;
					id: string;
					reason: string;
				};
				Insert: {
					created_at?: string;
					detail?: string | null;
					id?: string;
					reason: string;
				};
				Update: {
					created_at?: string;
					detail?: string | null;
					id?: string;
					reason?: string;
				};
				Relationships: [];
			};
			artist_artworks: {
				Row: {
					artist: string;
					artworks: Json;
					updated_at: string;
				};
				Insert: {
					artist: string;
					artworks?: Json;
					updated_at?: string;
				};
				Update: {
					artist?: string;
					artworks?: Json;
					updated_at?: string;
				};
				Relationships: [];
			};
			data_sync_meta: {
				Row: {
					source: string;
					synced_at: string;
				};
				Insert: {
					source: string;
					synced_at?: string;
				};
				Update: {
					source?: string;
					synced_at?: string;
				};
				Relationships: [];
			};
			exhibitions: {
				Row: {
					admission: string | null;
					closed_days: string | null;
					collected_date: string | null;
					created_at: string;
					description: string;
					end_date: string | null;
					event_site: string | null;
					genre: string | null;
					id: number;
					image_url: string | null;
					museum_id: number | null;
					note: string | null;
					open_hours: string;
					source: string;
					start_date: string;
					synced_at: string | null;
					tags: string | null;
					ticket_url: string | null;
					title: string;
					type: string | null;
					updated_at: string;
					venue_name_fallback: string;
					web_site: string | null;
				};
				Insert: {
					admission?: string | null;
					closed_days?: string | null;
					collected_date?: string | null;
					created_at?: string;
					description?: string;
					end_date?: string | null;
					event_site?: string | null;
					genre?: string | null;
					id?: number;
					image_url?: string | null;
					museum_id?: number | null;
					note?: string | null;
					open_hours?: string;
					source?: string;
					start_date: string;
					synced_at?: string | null;
					tags?: string | null;
					ticket_url?: string | null;
					title: string;
					type?: string | null;
					updated_at?: string;
					venue_name_fallback: string;
					web_site?: string | null;
				};
				Update: {
					admission?: string | null;
					closed_days?: string | null;
					collected_date?: string | null;
					created_at?: string;
					description?: string;
					end_date?: string | null;
					event_site?: string | null;
					genre?: string | null;
					id?: number;
					image_url?: string | null;
					museum_id?: number | null;
					note?: string | null;
					open_hours?: string;
					source?: string;
					start_date?: string;
					synced_at?: string | null;
					tags?: string | null;
					ticket_url?: string | null;
					title?: string;
					type?: string | null;
					updated_at?: string;
					venue_name_fallback?: string;
					web_site?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'exhibitions_museum_id_fkey';
						columns: ['museum_id'];
						isOneToOne: false;
						referencedRelation: 'museums';
						referencedColumns: ['id'];
					},
				];
			};
			inquiries: {
				Row: {
					category: string;
					contact: string | null;
					content: string;
					created_at: string;
					id: string;
				};
				Insert: {
					category?: string;
					contact?: string | null;
					content: string;
					created_at?: string;
					id?: string;
				};
				Update: {
					category?: string;
					contact?: string | null;
					content?: string;
					created_at?: string;
					id?: string;
				};
				Relationships: [];
			};
			museums: {
				Row: {
					accessibility: Json | null;
					address: string | null;
					amenities: string | null;
					created_at: string;
					description: string | null;
					gps_x: string | null;
					gps_y: string | null;
					homepage_url: string | null;
					id: number;
					name: string;
					notes: string | null;
					open_hours: string | null;
					parking: string | null;
					phone: string | null;
					rstdeInfo: string | null;
					synced_at: string | null;
					updated_at: string;
					venue_group_name: string | null;
				};
				Insert: {
					accessibility?: Json | null;
					address?: string | null;
					amenities?: string | null;
					created_at?: string;
					description?: string | null;
					gps_x?: string | null;
					gps_y?: string | null;
					homepage_url?: string | null;
					id?: number;
					name: string;
					notes?: string | null;
					open_hours?: string | null;
					parking?: string | null;
					phone?: string | null;
					rstdeInfo?: string | null;
					synced_at?: string | null;
					updated_at?: string;
					venue_group_name?: string | null;
				};
				Update: {
					accessibility?: Json | null;
					address?: string | null;
					amenities?: string | null;
					created_at?: string;
					description?: string | null;
					gps_x?: string | null;
					gps_y?: string | null;
					homepage_url?: string | null;
					id?: number;
					name?: string;
					notes?: string | null;
					open_hours?: string | null;
					parking?: string | null;
					phone?: string | null;
					rstdeInfo?: string | null;
					synced_at?: string | null;
					updated_at?: string;
					venue_group_name?: string | null;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					display_name: string | null;
					id: string;
					onboarding_completed: boolean;
					preferred_artists: string[];
					preferred_genres: string[];
					push_token: string | null;
					updated_at: string;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					id: string;
					onboarding_completed?: boolean;
					preferred_artists?: string[];
					preferred_genres?: string[];
					push_token?: string | null;
					updated_at?: string;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					id?: string;
					onboarding_completed?: boolean;
					preferred_artists?: string[];
					preferred_genres?: string[];
					push_token?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			bookmark_audio: {
				Row: {
					audio_guide_id: string | null;
					created_at: string;
					id: string;
					user_id: string;
				};
				Insert: {
					audio_guide_id?: string | null;
					created_at?: string;
					id?: string;
					user_id: string;
				};
				Update: {
					audio_guide_id?: string | null;
					created_at?: string;
					id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'bookmark_audio_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'bookmark_audio_audio_guide_id_fkey';
						columns: ['audio_guide_id'];
						isOneToOne: false;
						referencedRelation: 'audio_guides';
						referencedColumns: ['id'];
					},
				];
			};
			visits: {
				Row: {
					date: string;
					exhibition_id: number | null;
					exhibition_title: string | null;
					memo: string | null;
					user_id: string;
					venue: string | null;
				};
				Insert: {
					date: string;
					exhibition_id?: number | null;
					exhibition_title?: string | null;
					memo?: string | null;
					user_id: string;
					venue?: string | null;
				};
				Update: {
					date?: string;
					exhibition_id?: number | null;
					exhibition_title?: string | null;
					memo?: string | null;
					user_id?: string;
					venue?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'visits_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'visits_exhibition_id_fkey';
						columns: ['exhibition_id'];
						isOneToOne: false;
						referencedRelation: 'exhibitions';
						referencedColumns: ['id'];
					},
				];
			};
			bookmark_exhibitions: {
				Row: {
					created_at: string;
					exhibition_id: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					exhibition_id: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					exhibition_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'user_bookmarks_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			is_allowed_web_url: { Args: { raw: string }; Returns: boolean };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never) = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
