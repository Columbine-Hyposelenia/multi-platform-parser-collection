/**
 * Single source of truth for Twitter GraphQL `features` flag values.
 * Endpoint definitions list keys only; values default from here, with optional per-query overrides.
 * Refresh from a browser capture when Twitter ships new flags; resolve conflicts by majority across endpoints or explicit overrides in queries.ts.
 */
export const TWITTER_GRAPHQL_FEATURES = {
  android_graphql_skip_api_media_color_palette: true,
  articles_api_enabled: true,
  articles_preview_enabled: true,
  articles_timeline_profile_tab_enabled: true,
  birdwatch_consumption_enabled: false,
  blue_business_profile_image_shape_enabled: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  communities_web_enable_tweet_community_results_fetch: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  content_disclosure_indicator_enabled: true,
  continue_watching_consume_graphql: false,
  conversational_replies_ios_downvote_api_enabled: true,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  graphql_unified_card_enabled: true,
  grok_android_analyze_trend_fetch_enabled: false,
  grok_edit_with_grok_button_under_post_include_grok_image_annotation_in_graphql: false,
  grok_ios_author_view_analyze_button_fetch_trends_enabled: false,
  grok_ios_tweet_detail_followups_enabled: false,
  grok_translations_community_note_auto_translation_is_enabled: true,
  grok_translations_community_note_translation_is_enabled: true,
  grok_translations_post_auto_translation_is_enabled: true,
  hidden_profile_subscriptions_enabled: true,
  highlights_tweets_tab_ui_enabled: true,
  immersive_video_status_linkable_timestamps: true,
  ios_button_layout_fix_use_grok_annotations: false,
  ios_home_timeline_external_status_injections_fetch_tweet_facepile_enabled: false,
  ios_notifications_replies_mentions_device_follow_enabled: true,
  ios_tweet_detail_always_load_is_translatable: true,
  longform_notetweets_consumption_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  payments_enabled: false,
  post_ctas_fetch_enabled: true,
  premium_content_api_read_enabled: false,
  profile_foundations_has_spaces_graphql_enabled: false,
  profile_label_improvements_pcf_edit_profile_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  profile_label_improvements_pcf_label_in_profile_enabled: true,
  profile_label_improvements_pcf_settings_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  responsive_web_enhance_cards_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_grok_analysis_button_from_backend: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  responsive_web_grok_bio_auto_translation_is_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_profile_redirect_enabled: false,
  responsive_web_twitter_article_notes_tab_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  rito_safety_mode_features_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  rweb_video_screen_enabled: false,
  ssp_ads_preroll_enabled: false,
  standardized_nudges_misinfo: true,
  subscriptions_feature_can_gift_premium: true,
  subscriptions_verification_info_enabled: true,
  subscriptions_verification_info_is_identity_verified_enabled: true,
  subscriptions_verification_info_verified_since_enabled: true,
  super_follow_badge_privacy_enabled: true,
  super_follow_exclusive_tweet_notifications_enabled: true,
  super_follow_tweet_api_enabled: true,
  super_follow_user_api_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  tweet_context_is_enabled: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  tweet_with_visibility_results_prefer_gql_media_interstitial_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: true,
  unified_cards_destination_url_params_enabled: true,
  verified_phone_label_enabled: false,
  view_counts_everywhere_api_enabled: true,
  x_jetfuel_enable_frames_on_posts: true
} as const;

export type TwitterGqlFeatureKey = keyof typeof TWITTER_GRAPHQL_FEATURES;

export function pickTwitterGqlFeatures(
  keys: readonly TwitterGqlFeatureKey[]
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const key of keys) {
    result[key] = TWITTER_GRAPHQL_FEATURES[key];
  }
  return result;
}
