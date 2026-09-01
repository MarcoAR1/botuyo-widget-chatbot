/**
 * Centralized icon exports to optimize bundle size
 * All lucide-react icons are imported here and re-exported
 * This allows for better tree-shaking and reduces duplication
 */

export {
  // ChatWindow icons
  X,
  ShieldCheck,
  Heart,

  // InputArea icons
  Paperclip,
  Send,
  Loader2,
  Camera,
  Image as ImageIcon,
  FileAudio,
  FileText,
  FileIcon,
  Plus,
  MapPin,
  Mic,
  Trash2,
  Phone, // Voice call icon

  // AudioPlayer icons
  Play,
  Pause,
  AlertCircle, // Error state
  RotateCw, // Retry button

  // Launcher icons
  MessageCircle,

  // Gallery icons
  ChevronLeft,
  ChevronRight,
  ZoomIn,

  // MessageBubble icons
  CheckCheck,
  MapPin as MapPinBubble,
  ExternalLink,
  ArrowRight,
  Download,

  // ToolProposalCard icons (tool approval)
  Check,
  Sparkles,
} from 'lucide-react'
