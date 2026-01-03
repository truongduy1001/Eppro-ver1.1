
import type { ContractType } from './types.ts';

export const CONTRACT_TYPES: ContractType[] = [
  {
    id: 'general',
    name: 'Chung / Không xác định',
    description: 'Kiểm tra chung không tập trung vào loại hợp đồng cụ thể. Phân tích lỗi chính tả cơ bản trong toàn bộ văn bản.',
  },
  {
    id: 'mua_ban_tai_san',
    name: '1. Hợp đồng mua bán tài sản',
    description: 'Hợp đồng mua bán tài sản là sự thỏa thuận giữa các bên, theo đó bên bán chuyển quyền sở hữu tài sản cho bên mua và bên mua trả tiền cho bên bán. (Theo khoản 1 Điều 430 Bộ luật Dân sự 2015)',
  },
  {
    id: 'trao_doi_tai_san',
    name: '2. Hợp đồng trao đổi tài sản',
    description: 'Hợp đồng trao đổi tài sản là sự thỏa thuận giữa các bên, theo đó các bên giao tài sản và chuyển quyền sở hữu đối với tài sản cho nhau. (Theo khoản 1 Điều 455 Bộ luật Dân sự 2015)',
  },
  {
    id: 'tang_cho_tai_san',
    name: '3. Hợp đồng tặng cho tài sản',
    description: 'Hợp đồng tặng cho tài sản là sự thỏa thuận giữa các bên, theo đó bên tặng cho giao tài sản của mình và chuyển quyền sở hữu cho bên được tặng cho mà không yêu cầu đền bù, bên được tặng cho đồng ý nhận. (Theo Điều 457 Bộ luật Dân sự 2015)',
  },
  {
    id: 'vay_tai_san',
    name: '4. Hợp đồng vay tài sản',
    description: 'Hợp đồng vay tài sản là sự thỏa thuận giữa các bên, theo đó bên cho vay giao tài sản cho bên vay; khi đến hạn trả, bên vay phải hoàn trả cho bên cho vay tài sản cùng loại theo đúng số lượng, chất lượng và chỉ phải trả lãi nếu có thỏa thuận hoặc pháp luật có quy định. (Theo Điều 463 Bộ luật Dân sự 2015)',
  },
  {
    id: 'thue_tai_san',
    name: '5. Hợp đồng thuê tài sản',
    description: 'Hợp đồng thuê tài sản là sự thỏa thuận giữa các bên, theo đó bên cho thuê giao tài sản cho bên thuê để sử dụng trong một thời hạn, bên thuê phải trả tiền thuê. (Theo khoản 1 Điều 472 Bộ luật Dân sự 2015). Hợp đồng thuê khoán tài sản là sự thỏa thuận giữa các bên, theo đó bên cho thuê khoán giao tài sản cho bên thuê khoán để khai thác công dụng, hưởng hoa lợi, lợi tức thu được từ tài sản thuê khoán và bên thuê khoán có nghĩa vụ trả tiền thuê. (Theo Điều 483 Bộ luật Dân sự 2015)',
  },
  {
    id: 'muon_tai_san',
    name: '6. Hợp đồng mượn tài sản',
    description: 'Hợp đồng mượn tài sản là sự thỏa thuận giữa các bên, theo đó bên cho mượn giao tài sản cho bên mượn để sử dụng trong một thời hạn mà không phải trả tiền, bên mượn phải trả lại tài sản đó khi hết thời hạn mượn hoặc mục đích mượn đã đạt được. (Theo Điều 494 Bộ luật Dân sự 2015)',
  },
  {
    id: 'quyen_su_dung_dat',
    name: '7. Hợp đồng về quyền sử dụng đất',
    description: 'Hợp đồng về quyền sử dụng đất là sự thỏa thuận giữa các bên, theo đó người sử dụng đất chuyển đổi, chuyển nhượng, cho thuê, cho thuê lại, tặng cho, thế chấp, góp vốn quyền sử dụng đất hoặc thực hiện quyền khác theo quy định của Luật đất đai cho bên kia; bên kia thực hiện quyền, nghĩa vụ theo hợp đồng với người sử dụng đất. (Điều 500 Bộ luật Dân sự 2015)',
  },
  {
    id: 'hop_tac',
    name: '8. Hợp đồng hợp tác',
    description: 'Hợp đồng hợp tác là sự thỏa thuận giữa các cá nhân, pháp nhân về việc cùng đóng góp tài sản, công sức để thực hiện công việc nhất định, cùng hưởng lợi và cùng chịu trách nhiệm. (Điều 504 Bộ luật Dân sự 2015)',
  },
  {
    id: 'dich_vu',
    name: '9. Hợp đồng dịch vụ',
    description: 'Hợp đồng dịch vụ là sự thỏa thuận giữa các bên, theo đó bên cung ứng dịch vụ thực hiện công việc cho bên sử dụng dịch vụ, bên sử dụng dịch vụ phải trả tiền dịch vụ cho bên cung ứng dịch vụ. (Theo Điều 513 Bộ luật Dân sự 2015)',
  },
  {
    id: 'van_chuyen',
    name: '10. Hợp đồng vận chuyển',
    description: 'Hợp đồng vận chuyển hành khách là sự thỏa thuận giữa các bên, theo đó bên vận chuyển chuyên chở hành khách, hành lý đến địa điểm đã định theo thỏa thuận, hành khách phải thanh toán cước phí vận chuyển. (Theo Điều 522 Bộ luật Dân sự 2015). Hợp đồng vận chuyển tài sản là sự thỏa thuận giữa các bên, theo đó bên vận chuyển có nghĩa vụ chuyển tài sản đến địa điểm đã định theo thỏa thuận và giao tài sản đó cho người có quyền nhận, bên thuê vận chuyển có nghĩa vụ trả cước phí vận chuyển. (Điều 530 Bộ luật Dân sự 2015)',
  },
  {
    id: 'gia_cong',
    name: '11. Hợp đồng gia công',
    description: 'Hợp đồng gia công là sự thỏa thuận giữa các bên, theo đó bên nhận gia công thực hiện công việc để tạo ra sản phẩm theo yêu cầu của bên đặt gia công, bên đặt gia công nhận sản phẩm và trả tiền công. (Theo Điều 542 Bộ luật Dân sự 2015)',
  },
  {
    id: 'gui_giu_tai_san',
    name: '12. Hợp đồng gửi giữ tài sản',
    description: 'Hợp đồng gửi giữ tài sản là sự thỏa thuận giữa các bên, theo đó bên giữ nhận tài sản của bên gửi để bảo quản và trả lại chính tài sản đó cho bên gửi khi hết thời hạn hợp đồng, bên gửi phải trả tiền công cho bên giữ, trừ trường hợp gửi giữ không phải trả tiền công. (Theo Điều 554 Bộ luật Dân sự 2015)',
  },
  {
    id: 'uy_quyen',
    name: '13. Hợp đồng ủy quyền',
    description: 'Hợp đồng ủy quyền là sự thỏa thuận giữa các bên, theo đó bên được ủy quyền có nghĩa vụ thực hiện công việc nhân danh bên ủy quyền, bên ủy quyền chỉ phải trả thù lao nếu có thỏa thuận hoặc pháp luật có quy định. (Điều 562 Bộ luật Dân sự 2015)',
  },
  {
    id: 'thi_cong_lap_dat',
    name: '14. Hợp đồng dịch vụ thi công/lắp đặt thiết bị',
    description: 'Hợp đồng liên quan đến việc cung cấp dịch vụ thi công công trình hoặc lắp đặt các loại thiết bị theo yêu cầu, thường bao gồm các điều khoản về nghiệm thu, bảo hành, và an toàn lao động.',
  },
];